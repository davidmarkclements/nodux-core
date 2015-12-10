#!/bin/sh

# sanity check
sudo chown -R tc /home/tc

# for ssh login (will generate local keypairs on first run automatically)
sudo /usr/local/etc/init.d/openssh start

# setup authorized_keys
sudo /etc/init.d/set-ssh-auth-key

# setup up relay fs
sudo chmod +x /usr/local/bin/vmfs
sudo chmod +x /usr/local/bin/hyperfused
sudo /usr/local/bin/vmfs