#!/bin/bash
# Use this script to set up the pre-requisite installations of your instance
# for example, the script below sets up the instance to run a nodejs app

sudo yum -y update
sudo yum install -y aws-cfn-bootstrap
sudo yum -y install git

sudo yum install curl -y
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
nvm install 18