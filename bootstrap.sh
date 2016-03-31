#!/bin/bash

apt-get -y update

# Install N node version manager
apt-get -y install bash git curl make
curl -L https://git.io/n-install | su vagrant -c "bash -s -- -q lts"
. /home/vagrant/.bashrc

# Configure npm
cat <<EOF > /home/vagrant/.npmrc
loglevel=http
save-prefix=
EOF

# Change default CWD to /vagrant
echo "cd /vagrant" >> /home/vagrant/.bashrc
