import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { HealthCheck } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { Ec2AutoScalingStack } from './ec2-autoscaling-stack';

interface CoreComputeStackProps extends cdk.StackProps {
    appName: string;
    deploymentStage: string;
    ssmParameterStore: {
        githubAccountParameterName: string;
        githubPersonalAccessTokenParameterName: string;
    };
    github: {
        repoName: string;
        branchName: string;
    };
    hostedZone: route53.IHostedZone;
    healthCheck: HealthCheck;
    instanceType: string;
}

export class CoreComputeStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: CoreComputeStackProps) {
        super(scope, id, props);

        if (!props?.github.repoName || !props.github.branchName) throw new Error('No repo or branch name specified');

        const vpc = new ec2.Vpc(this, `${props.appName}-Vpc`, {
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ],
        });

        const asg = new Ec2AutoScalingStack(this, `${props.appName}-Ec2AutoScalingStack`, {
            vpc,
            hostedZone: props.hostedZone,
            appName: props.appName,
            deploymentStage: props.deploymentStage,
            healthCheck: props.healthCheck,
            github: {
                githubAccountParameterName: props.ssmParameterStore.githubAccountParameterName,
                githubPersonalAccessTokenParameterName: props.ssmParameterStore.githubPersonalAccessTokenParameterName,
                repoName: props.github.repoName,
                branchName: props.github.branchName,
            },
            instanceType: props.instanceType,
            targetCpuUtilizationPercent: 75,
            maxInstanceLifetimeDays: 1,
            maxInstanceAmount: 2,
            minInstanceAmount: 1,
            estimatedTimeToStartInstanceSeconds: 300,
            env: props.env,
        });
    }
}
