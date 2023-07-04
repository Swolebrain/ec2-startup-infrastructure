import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { aws_ssm as ssm } from "aws-cdk-lib";


interface PrerequisitesStackProps extends cdk.StackProps {
    appName: string;
    deploymentStage: string;
    hostedZoneName: string;
}

/**
 * This stack is for things that need to be there before the compute stack is deployed.
 * SSM parameters, and route 53 hosted zones, for example
 */
export class PrerequisitesStack extends cdk.Stack {
    public readonly githubAccountKeySsmParameter: ssm.StringParameter;
    public readonly githubAccountKeySsmParameterName: string;
    public readonly githubPersonalAccessTokenSsmParameter: ssm.StringParameter;
    public readonly githubPersonalAccessTokenSsmParameterName: string;
    public readonly hostedZone: HostedZone;

    constructor(scope: Construct, id: string, props: PrerequisitesStackProps){
        super(scope, id, props);
        const { appName, deploymentStage, hostedZoneName } = props;
        this.githubAccountKeySsmParameterName = `/${appName}/${deploymentStage}/githubAccountName`;
        this.githubPersonalAccessTokenSsmParameterName = `/${appName}/${deploymentStage}/githubPersonalAccessToken`;
        this.githubAccountKeySsmParameter = new ssm.StringParameter(this, 'githubAccountKeySsmParameter', {
            parameterName: this.githubAccountKeySsmParameterName,
            stringValue: 'change me',
        });
        this.githubPersonalAccessTokenSsmParameter = new ssm.StringParameter(this, 'githubPersonalAccessTokenSsmParameter', {
            parameterName: this.githubPersonalAccessTokenSsmParameterName,
            stringValue: 'change me',
        })

        this.hostedZone = new HostedZone(this, 'HostedZone', {
            zoneName: hostedZoneName,
        });
    }
}