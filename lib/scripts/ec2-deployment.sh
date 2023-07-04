#!/bin/bash

USER=ec2-user

HOME=/home/ec2-user

cd $HOME

github_account=`aws ssm get-parameter --name {{github_account}} --region us-east-1 --query 'Parameter.Value' --output text`

# Personal Access Token
personal_access_token=`aws ssm get-parameter --name {{personal_access_token}} --region us-east-1 --query 'Parameter.Value' --output text`

repo_name={{repo_name}}

branch_name={{branch_name}}

if [ ! -d $repo_name ]; then
    # Clone the repository
    git clone https://${github_account}:${personal_access_token}@github.com/${github_account}/${repo_name}.git
fi

# Change directory to the repository
cd $repo_name

# Fetch latest changes from the branch
git fetch origin ${branch_name}

# Reset the repository to the latest commit on the branch
git reset --hard origin/${branch_name}

# Install any required dependencies or perform additional setup steps
npm install

# Start your application or perform other necessary actions
sudo chown -R $USER:$USER $HOME

# Signal the status from cfn-init\n
#/opt/aws/bin/cfn-signal -e $? --stack {{AWS::StackName}} --resource {{resourceId}} --region {{aws_region}}