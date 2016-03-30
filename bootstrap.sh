#!/bin/bash

apt-get -y update

# Install N node version manager
apt-get -y install bash git curl make
curl -L https://git.io/n-install | su vagrant -c "bash -s -- -y lts"

# Change default CWD to /vagrant
echo "cd /vagrant" >> /home/vagrant/.bashrc
