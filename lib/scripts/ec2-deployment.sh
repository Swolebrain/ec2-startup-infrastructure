#!/bin/bash
export HOME=/root

cd $HOME

# Access to nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
nvm use 18

github_account=$(aws ssm get-parameter --name {{github_account}} --region {{aws_region}} --query 'Parameter.Value' --output text)
personal_access_token=$(aws ssm get-parameter --name {{personal_access_token}} --region {{aws_region}} --query 'Parameter.Value' --output text)

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
