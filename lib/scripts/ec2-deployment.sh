#!/bin/bash
export USER=ec2-user
export HOME=/home/$USER

github_account=$(aws ssm get-parameter --name {{github_account}} --region {{aws_region}} --query 'Parameter.Value' --output text)
personal_access_token=$(aws ssm get-parameter --name {{personal_access_token}} --region {{aws_region}} --query 'Parameter.Value' --output text)

repo_name={{repo_name}}
branch_name={{branch_name}}

# Execute commands as $USER
sudo -i -u $USER bash <<EOF

cd $HOME

source .bashrc
nvm use 18

# Initialize github repo on instance
if [ ! -d $repo_name ]; then
    git clone https://${github_account}:${personal_access_token}@github.com/${github_account}/${repo_name}.git
fi

cd $repo_name

git fetch origin ${branch_name}
git reset --hard origin/${branch_name}

if [ -f "./install_dependencies.sh" ]; then
    sudo chmod +x ./install_dependencies.sh
    ./install_dependencies.sh
fi

if [ -f "./start_server.sh" ]; then
    sudo chmod +x ./start_server.sh
    ./start_server.sh
fi

# Give project ownership to user
sudo chown -R $USER:$USER $HOME

# End of commands executed as $USER
EOF
