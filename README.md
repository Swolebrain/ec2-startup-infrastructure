# EC2 autoscaling group with CDK

A CDK template you can easily tweak to launch an ec2 infrastructure

### Features
* ec2 infrastructure with autoscaling
* deploy the infrastructure quickly by running two cdk commands
* Infrastructure will pull newest code from github on deployment. By default, instances will refresh every day too.
* Most of the useful configurability you would want is available in bin/cdk-asg-starter.ts, you don't have to read all the cdk code

## Prerequisites
1. AWS cli installed and a default profile configured for your account
2. AWS CDK installed
3. AWS account bootstrapped for CDK

## How to use

1.`npm install`   to install dependencies
2. Change the configuration in bin/cdk-asg-starter.ts
3. `cdk synth --profile your_aws_profile`  to build the cloudformation stacks
4. `cdk deploy ${YOUR_APP_NAME}-Prereguisites --profile your_aws_profile` to deploy the first stack that contains your secrets and domain
5. Log into the AWS console and go to Systems manager in your chosen deployment region. Put your personal access token and github account id in the respective SSM parameters
6. Perform domain delegation from your domain registrar to the hosted zone that was deployed with the stack in step 3. This is very simple, just grab the NS records from your newly created route 53 hosted zone and set those up as the NS records that your domain registrar knows about (manage DNS in your domain registrar's dns management).
7. With those pre-requisites configured, you're ready to deploy the autoscaling group. You do this by running `cdk deploy ${YOUR_APP_NAME}-compute  --profile your_aws_profile`
8. *From then on, any time you change the compute stack you only need to deploy the compute stack as in step 6. You never need to deploy the prerequisites stack again.*

## Limitations

1. The app server github repo needs to live in the same github account as the one where this repo lives.
2. For many use cases, you'd likely want to scale up on memory utilization or request counts. This template only provides scaling on CPU utilization since the others are too application-specific.