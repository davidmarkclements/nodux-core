var fs = require('fs')
var path = require('path')
var nugget = require('nugget')
var server = 'http://tinycorelinux.net/6.x/x86_64/'
var dist = server + 'release/distribution_files/'

if (!fs.existsSync('src')) { fs.mkdirSync(path.join(__dirname, 'src')) }

nugget([
  dist + 'corepure64.gz', 
  dist + 'vmlinuz64',
  server + 'tcz/fuse.tcz',
  server + 'tcz/openssh.tcz',
  server + 'tcz/coreutils.tcz',
  server + 'tcz/binutils.tcz',
  server + 'tcz/file.tcz'
], {verbose: true, dir: path.join(__dirname, 'src')}, function(err) {
  if (err) {
    console.error('Error:', err)
    process.exit(1)
  }
  process.exit(0)
})