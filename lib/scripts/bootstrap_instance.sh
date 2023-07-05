#!/bin/bash
# Use this script to set up the pre-requisite installations of your instance
# for example, the script below sets up the instance to run a nodejs app

export USER=ec2-user
export HOME=/home/ec2-user

cd $HOME

sudo yum -y update
sudo yum install -y aws-cfn-bootstrap
sudo yum -y install git

sudo yum install curl -y

curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion

nvm install 18

sudo chown -R $USER:$USER $HOME
