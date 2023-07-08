#!/bin/bash
USER=ec2-user
HOME=/home/$USER

# Execute commands as $USER
sudo -i -u $USER bash <<EOF

cd $HOME

echo 'export APP_NAME={{APP_NAME}}' >>$HOME/.bashrc
echo 'export NODE_ENV={{NODE_ENV}}' >>$HOME/.bashrc

# End of commands executed as $USER
EOF
