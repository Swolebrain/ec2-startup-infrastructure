#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CoreComputeStack } from '../lib/core-compute-stack';
import { PrerequisitesStack } from "../lib/prerequisites-stack";

const app = new cdk.App();

const globalConfig = {
    appName: 'Burgalveist', // change this
    deploymentStage: 'staging',
    hostedZoneName: 'burgalveist.millionairecodersclub.com', //change this
    github: {
        repoName: 'sample-express-app', //change this
        branchName: 'master', // maybe change this
    },
    healthCheckPath: '/', // change this to the relative url of a non-auth protected endpoint in your code package. Consider deep health checks if it fits your use case: https://aws.amazon.com/blogs/networking-and-content-delivery/choosing-the-right-health-check-with-elastic-load-balancing-and-ec2-auto-scaling/
    instanceType: 't3.small', // change this if you need bigger instances
    cdkEnv: {
        region: 'us-east-2', // maybe change this but you might not wanna use us-east-1
        account: '891672395302', // change this
    },
};

const preRequisitesStack = new PrerequisitesStack(app, `${globalConfig.appName}-prerequisites`, {
    appName: globalConfig.appName,
    deploymentStage: globalConfig.deploymentStage,
    hostedZoneName: globalConfig.hostedZoneName,
    env: globalConfig.cdkEnv,
});

const computeStack = new CoreComputeStack(app, `${globalConfig.appName}-compute`, {
    appName: globalConfig.appName,
    deploymentStage: globalConfig.deploymentStage,
    ssmParameterStore: {
        githubAccountParameterName: preRequisitesStack.githubAccountKeySsmParameterName,
        githubPersonalAccessTokenParameterName: preRequisitesStack.githubPersonalAccessTokenSsmParameterName,
    },
    github: globalConfig.github,
    hostedZone: preRequisitesStack.hostedZone,
    healthCheck: {
        enabled: true,
        path: globalConfig.healthCheckPath,
    },
    instanceType: globalConfig.instanceType,
    env: globalConfig.cdkEnv,
});
