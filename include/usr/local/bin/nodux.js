/**
 *        __   __           
 *  |\ | /  \ |  \ |  | \_/ 
 *  | \| \__/ |__/ \__/ / \
 *
 *  VM Node Process Bootstap 
 *   
 *  node [node flags] nodux.js <host-cwd> <host-dirname> <host-env-json> <filename> [app flags]
 *
 *  Prepares environment to run host code in vm
 *  * creates chroot at host mount relay (/host)
 *  * changes cwd to cwd on host machine
 *  * parses and reconfigures args as they would normally apply
 *  * applies environment variables of host machine to vm process.env
 *  * re-initializes loading process to emulate behaviour of normal node process
 */

var Module = require('module')
var fs = require('fs')
var posix = require('../lib/node_modules/posix')
process.chdir('/host')
posix.chroot('/host')

Object.keys(require.cache).forEach(function (k) {
  delete require.cache[k]
})

var cwd = process.argv[2]
var dirname = process.argv[3]
var hostenv = JSON.parse(process.argv[4])
var filename = process.argv[5]

Object.keys(hostenv).forEach(function (k) {
  process.env[k] = hostenv[k]
})

process.chdir(cwd)

process.argv[1] = require.resolve(path.resolve(dirname, filename))

process.argv.splice(2, 3)

Module.runMain()