#!/bin/sh
# prerequisites: apt-get install squashfs-tools/brew install squashfs

# exit on any error
set -e

mkdir -p dist

# install packages
for f in src/*.tcz; do echo "Unpacking $f" && unsquashfs -f -d dist $f; done

# enter dist folder
cd dist

# extract rootfs
zcat < ../src/corepure64.gz | sudo cpio -i -d

sudo sed -ix "/^# ttyS0$/s#^..##" etc/securetty
sudo sed -ix "/^tty1:/s#tty1#ttyS0#g" etc/inittab

# configure ssh server
sudo cp usr/local/etc/ssh/sshd_config_example usr/local/etc/ssh/sshd_config
sudo mkdir var/ssh
sudo chmod 0755 var/ssh
sudo mkdir -p home/tc/.ssh

sudo ln -s ./lib ./lib64

# leave dist
cd ../

# install node
export NODE_VERSION='5.1.1'
./node_modules/.bin/nugget  "http://nodejs.org/dist/v$NODE_VERSION/node-v${NODE_VERSION}-linux-x64.tar.gz"
tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz"
cd "node-v${NODE_VERSION}-linux-x64"
sudo cp -R . ../dist/usr/local
cd ..
rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
rm -rf "node-v${NODE_VERSION}-linux-x64"


# copy our files in
sudo rsync --recursive include/ dist

# repackage core into final output
(cd dist ; sudo find . | sudo cpio -o -H newc) | gzip -c > initrd.gz


# cleanup
sudo rm -rf dist

mkdir -p os
mv initrd.gz os
cp src/vmlinuz64 os

echo "done"