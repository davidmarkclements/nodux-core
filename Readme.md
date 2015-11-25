# nodux-core

A Tiny Core Linux build that includes node.js

The basis of nodux.

## Developer Notes

### Download

The `download.js` file retrieves necessary assets for the Tiny Core Linux
image plus additional development packages we need for installing node.

### Build

The `build.sh` file uses extracts the OS from the `initrd.gz` cpio 
archive, injects additional packages such as openssh, and coreutils,
downloads the node binary and injects it into the OS dist.

We may need to do more for native module building (or supply an 
enlarged nodux base for this purpose).