import * as fs from 'fs';
import * as path from 'path';

import { aws_route53_targets as targets, aws_autoscaling } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { HealthCheck } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Duration } from 'aws-cdk-lib/core';

const deploymentScriptBase = fs.readFileSync(path.join(__dirname, 'scripts', 'ec2-deployment.sh'), 'utf8');

interface Ec2AutoScalingStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    hostedZone: route53.IHostedZone;
    appName: string;
    deploymentStage: string;
    healthCheck: HealthCheck;
    github: {
        githubAccountParameterName: string;
        githubPersonalAccessTokenParameterName: string;
        repoName: string;
        branchName: string;
    };
    instanceType: string;
    maxInstanceAmount: number;
    minInstanceAmount: number;
    maxInstanceLifetimeDays: number;
    targetCpuUtilizationPercent: number;
    estimatedTimeToStartInstanceSeconds: number;
    env?: cdk.Environment;
}

export class Ec2AutoScalingStack extends Construct {
    constructor(scope: Construct, id: string, props: Ec2AutoScalingStackProps) {
        super(scope, id);
        const resourceNamePrefix = `${props.appName}-${props.deploymentStage}`;

        const deploymentScript = deploymentScriptBase
            .replace(/{{github_account}}/g, props.github.githubAccountParameterName)
            .replace(/{{personal_access_token}}/g, props.github.githubPersonalAccessTokenParameterName)
            .replace(/{{repo_name}}/g, props.github.repoName)
            .replace(/{{branch_name}}/g, props.github.branchName)
            .replace(/{{aws_region}}/g, props.env?.region || 'us-east-1');

        const instanceSecurityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
            vpc: props.vpc,
        });

        const instanceRole = new iam.Role(this, 'InstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
        });

        // Create a launch template for EC2 instances
        const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
            instanceType: new ec2.InstanceType(props.instanceType),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            securityGroup: instanceSecurityGroup,
            role: instanceRole,
            requireImdsv2: true,
        });

        // Create an EC2 Auto Scaling Group
        const autoScalingGroup = new aws_autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
            autoScalingGroupName: `${resourceNamePrefix}-ASG`,
            vpc: props.vpc,
            minCapacity: props.minInstanceAmount,
            maxCapacity: props.maxInstanceAmount,
            launchTemplate,
            maxInstanceLifetime: props.maxInstanceLifetimeDays ? Duration.days(props.maxInstanceLifetimeDays) : undefined,
            defaultInstanceWarmup: Duration.seconds(10),
            ssmSessionPermissions: true,
            groupMetrics: [aws_autoscaling.GroupMetrics.all()],
            signals: aws_autoscaling.Signals.waitForMinCapacity({
                minSuccessPercentage: 50,
                timeout: Duration.seconds(props.estimatedTimeToStartInstanceSeconds * 2),
            }),
            init: ec2.CloudFormationInit.fromElements(
                ec2.InitFile.fromAsset('/etc/bootstrap', './lib/scripts/bootstrap_instance.sh', { mode: '000744' }),
                ec2.InitFile.fromString('/etc/deploy', deploymentScript, { mode: '000744' }),
                ec2.InitCommand.shellCommand('/etc/bootstrap', { cwd: '~' }),
                ec2.InitCommand.shellCommand('/etc/deploy', { cwd: '~' })
            ),
        });

        autoScalingGroup.scaleOnCpuUtilization(`${resourceNamePrefix}-ASGCpuUtilizationScalingPolicy`, {
            targetUtilizationPercent: props.targetCpuUtilizationPercent,
        });

        // Create a security group for the load balancer
        const lbSecurityGroup = new ec2.SecurityGroup(this, `${resourceNamePrefix}-LBSG`, {
            vpc: props.vpc,
        });

        // Allow incoming traffic on port 80 and 443 from anywhere (adjust as needed)
        lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
        lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

        // Create a load balancer
        const loadBalancer = new elbv2.ApplicationLoadBalancer(this, `${resourceNamePrefix}-LB`, {
            vpc: props.vpc,
            internetFacing: true,
            securityGroup: lbSecurityGroup,
            loadBalancerName: `${resourceNamePrefix}-LB`,
        });

        // Create a listener for HTTP on port 80 (to redirect to HTTPS)
        const httpListener = loadBalancer.addListener('HttpListener', {
            port: 80,
            open: true,
            defaultAction: elbv2.ListenerAction.redirect({
                protocol: elbv2.Protocol.HTTPS,
            }),
        });

        const subDomain = `${props.deploymentStage}-api`;
        const subDomainName = `${subDomain}.${props.hostedZone.zoneName}`;

        const aRecord = new route53.ARecord(this, `ARecord`, {
            zone: props.hostedZone,
            recordName: subDomain,
            target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(loadBalancer)),
        });

        const certificate = new acm.Certificate(this, 'Certificate', {
            domainName: subDomainName,
            validation: acm.CertificateValidation.fromDns(props.hostedZone),
        });

        const httpsListener = loadBalancer.addListener('HttpsListener', {
            port: 443,
            certificates: [certificate],
        });

        httpsListener.addTargets('AutoScalingGroupTargets', {
            targets: [autoScalingGroup],
            port: 80,
            healthCheck: props.healthCheck,
        });

        new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
            value: loadBalancer.loadBalancerDnsName,
        });

        new cdk.CfnOutput(this, 'AutoScalingGroupName', {
            value: autoScalingGroup.autoScalingGroupName,
        });
    }
}
