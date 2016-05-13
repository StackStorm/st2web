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

# mount node_modules locally and make them persist through the reboot
mkdir -p /home/vagrant/node_modules
chown vagrant:vagrant /home/vagrant/node_modules
mount --bind /home/vagrant/node_modules/ /vagrant/node_modules
cat <<EOF >> /etc/fstab
/home/vagrant/node_modules/	/vagrant/node_modules	none	bind
EOF

# Change default CWD to /vagrant
echo "cd /vagrant" >> /home/vagrant/.bashrc
