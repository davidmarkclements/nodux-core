/**
 *        __   __
 *  |\ | /  \ |  \ |  | \_/
 *  | \| \__/ |__/ \__/ / \
 *
 *  VM Node Process Bootstap
 *
 *  sudo PID=<host_process_pid> node [node flags] nodux.js <filename> [app flags]
 *
 *  Prepares environment to run host code in vm
 *  * creates chroot at host mount relay (/host) (chroot posix syscall requires sudo access)
 *  * changes cwd to cwd on host machine
 *  * parses and reconfigures args as they would normally apply
 *  * applies environment variables of host machine to vm env
 *  * re-initializes loading process to emulate behaviour of normal node process
 */

var pid = process.env.PID
var env = require('/host/env/' + pid + '.json')

var Module = require('module')
var path = require('path')
var fs = require('fs')
var posix = require('../lib/node_modules/posix')

var cwd = env.NODUX_HOST_CWD
var hostenv = env.NODUX_HOST_ENV ? JSON.parse(env.NODUX_HOST_ENV) : {}
var filename = process.argv[2]


fs.writeFileSync('/proc/sys/kernel/core_pattern', '/home/tc/%p.%t.core')
posix.setrlimit('core', {soft: null, hard: null})

if (!env.__NODUX_KLUDGE_JAIL__) {
  chrootJail()
}

if (env.__NODUX_KLUDGE_JAIL__) {
  kludgeJail()
}

Object.keys(require.cache).forEach(function (k) {
  delete require.cache[k]
})

if (env.__NODUX_SYNTAX_CHECK_ONLY__) {
   return checkSyntax()
}

if (env.__NODUX_EVAL__) {
  process._eval = env.__NODUX_EVAL__
  if (env.__NODUX_PRINT_EVAL_RESULT__) {
    process._print_eval = true
  }
}

if (env.__NODUX_REPL__) {
  process._forceRepl = true
}

process.env = Object.assign(process.env, env)
process.vmEnv = process.env

process.env = Object.keys(hostenv).reduce(function (o, k) {
  o[k] = hostenv[k]
  return o
}, {})

process.chdir(cwd)

if (process._eval) {
  if (process.vmEnv.__NODUX_STDIN_EVAL__) {
    return evalScript('[stdin]')
  }
  return evalScript('[eval]')
}

if (!filename) {
  return require('repl').start('> ')
}

process.argv.splice(1, 1)

if (process.argv[1][0] !== '.' && process.argv[1][0] !== '/') {
  process.argv[1] = './' + process.argv[1]
}

if (env.__NODUX_KLUDGE_JAIL__ && process.argv[1][0] === '.') {
  process.argv[1] = path.resolve(process.cwd() + '/' + process.argv[1])
}

Module.runMain()

//lifted (and modified) from src/node.js
function evalScript(name) {
  var Module = require('module')
  var path = require('path')
  try {
    var cwd = process.cwd()
  } catch (e) {
    // getcwd(3) can fail if the current working directory has been deleted.
    // Fall back to the directory name of the (absolute) executable path.
    // It's not really correct but what are the alternatives?
    var cwd = path.dirname(process.execPath)
  }

  var module = new Module(name)
  module.filename = path.join(cwd, name)
  module.paths = Module._nodeModulePaths(cwd)
  var script = process._eval
  var body = script
  script = 'global.__filename = ' + JSON.stringify(name) + ';\n' +
           'global.exports = exports;\n' +
           'global.module = module;\n' +
           'global.__dirname = __dirname;\n' +
           'global.require = require;\n' +
           'return require("vm").runInThisContext(' +
           JSON.stringify(body) + ', { filename: ' +
           JSON.stringify(name) + ' });\n';
  // Defer evaluation for a tick.  This is a workaround for deferred
  // events not firing when evaluating scripts from the command line,
  // see https://github.com/nodejs/node/issues/1600.
  process.nextTick(function() {
    var result = module._compile(script, name + '-wrapper')
    if (process._print_eval) console.log(result)
  })
}

//lifted (and modified) from src/node.js
function checkSyntax() {
  var vm = require('vm')
  var fs = require('fs')
  var Module = require('module')
  var source = fs.readFileSync(require.resolve(path.resolve(cwd, filename)), 'utf-8')
  // remove shebang and BOM
  source = stripBom(source.replace(/^\#\!.*/, ''))
  // wrap it
  source = Module.wrap(source)
  // compile the script, this will throw if it fails
  new vm.Script(source, {filename: filename, displayErrors: true})
  process.exit(0)
}

function stripBom(x) {
  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM)
  if (typeof x === 'string' && x.charCodeAt(0) === 0xFEFF) {
    return x.slice(1)
  }

  if (Buffer.isBuffer(x) && isUtf8(x) && x[0] === 0xEF && x[1] === 0xBB && x[2] === 0xBF) {
    return x.slice(3)
  }

  return x
}

function isUtf8(bytes) {
  var i = 0
  while(i < bytes.length) {
    if((// ASCII
        bytes[i] == 0x09 ||
        bytes[i] == 0x0A ||
        bytes[i] == 0x0D ||
        (0x20 <= bytes[i] && bytes[i] <= 0x7E)
      )) {
        i += 1
        continue
      }

    if((// non-overlong 2-byte
        (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
        (0x80 <= bytes[i+1] && bytes[i+1] <= 0xBF)
    )) {
      i += 2
      continue
    }

    if((// excluding overlongs
      bytes[i] == 0xE0 &&
      (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      ) ||
      (// straight 3-byte
       ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
        bytes[i] == 0xEE ||
        bytes[i] == 0xEF) &&
       (0x80 <= bytes[i + 1] && bytes[i+1] <= 0xBF) &&
       (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
      ) ||
      (// excluding surrogates
       bytes[i] == 0xED &&
       (0x80 <= bytes[i+1] && bytes[i+1] <= 0x9F) &&
       (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
      )
    ) {
      i += 3
      continue
    }

    if((// planes 1-3
      bytes[i] == 0xF0 &&
      (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
      (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
    ) ||
    (// planes 4-15
      (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
      (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
    ) ||
    (// plane 16
      bytes[i] == 0xF4 &&
      (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
      (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
      (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
    )) {
      i += 4
      continue
    }

    return false
  }

  return true
}


function chrootJail() {
  process.chdir('/host')
  posix.chroot('/host')
}

function kludgeJail() {

  path._makeLong = function (p) {
    if (/^\/host/.test(p)) {
      return p
    }
    return '/host' + p
  }

  process.chdir = (function (chdir) {
    return function (p) {
      if (/^\/host/.test(p)) {
        return chdir(p)
      }
      return chdir('/host' + p)
    }
  }(process.chdir))

  process.cwd = (function (cwd) {
    return function() {
      var d = cwd()
      return d.replace(/^\/host/, '')
    }
  }(process.cwd))

  Module.prototype._compile = (function (compile) {
    return function (content, filename) {
      var pd = path.dirname
      path.dirname = function (p) {
        return p.replace(/^\/host/, '')
      }
      var result = compile.call(this, content, filename)
      path.dirname = pd
      return result
    }
  }(Module.prototype._compile))

}
