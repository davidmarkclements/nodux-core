/**
 *        __   __           
 *  |\ | /  \ |  \ |  | \_/ 
 *  | \| \__/ |__/ \__/ / \
 *
 *  VM Node Process Bootstap 
 *   
 *  sudo node [node flags] nodux.js <host-cwd> <host-env-json> <filename> [app flags]
 *  
 *  Prepares environment to run host code in vm
 *  * creates chroot at host mount relay (/host) (chroot posix syscall requires sudo access)
 *  * changes cwd to cwd on host machine
 *  * parses and reconfigures args as they would normally apply
 *  * applies environment variables of host machine to vm process.env
 *  * re-initializes loading process to emulate behaviour of normal node process
 */

var Module = require('module')
var path = require('path')
var fs = require('fs')
var posix = require('../lib/node_modules/posix')
process.chdir('/host')
posix.chroot('/host')

Object.keys(require.cache).forEach(function (k) {
  delete require.cache[k]
})

var cwd = process.argv[2]
var hostenv = JSON.parse(process.argv[3])
var filename = process.argv[4]

process.vmEnv = process.env

process.env = Object.keys(hostenv).reduce(function (o, k) {
  o[k] = hostenv[k]
  return o
}, {})

process.chdir(cwd)

process.argv[1] = require.resolve(path.resolve(cwd, filename))

process.argv.splice(2, 4)

Module.runMain()