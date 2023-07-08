#!/bin/bash
# Use this script to set up the pre-requisite installations of your instance
# for example, the script below sets up the instance to run a nodejs app

USER=ec2-user
HOME=/home/$USER

sudo yum -y update
sudo yum install -y aws-cfn-bootstrap
sudo yum -y install git

sudo yum install curl -y

# Execute commands as $USER
sudo -i -u $USER bash <<EOF
cd $HOME

curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

echo 'export NVM_DIR="$HOME/.nvm"' >>$HOME/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >>$HOME/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >>$HOME/.bashrc

source $HOME/.bashrc

nvm install 18

sudo chown -R $USER:$USER $HOME

EOF
# End of commands executed as $USER
