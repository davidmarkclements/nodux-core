var fs = require('fs')
var path = require('path')
var dl = require('download-stream')
var server = 'http://tinycorelinux.net/6.x/x86_64/'
//fallback mirror:
// var server = 'http://distro.ibiblio.org/tinycorelinux/6.x/x86_64/'

var dist = server + 'release/distribution_files/'
var out = path.join(__dirname, 'src')

if (!fs.existsSync(out)) { fs.mkdirSync(out) }

dl(dist + 'corepure64.gz' ).pipe(w('corepure64.gz'))
dl(dist + 'vmlinuz64').pipe(w('vmlinuz64'))

;[ 
  'acl', 'attr', 'bzip2-lib',
  'cloog', 'diffutils', 'expat2',
  'fuse', 'git', 'gmp',
  'iproute2', 'isl', 'libcap', 'libffi', 
  'mpc', 'mpfr', 'openssh', 'openssl', 
  'python', 'readline', 'sqlite3', 'tcl', 'tk',
  'zlib_base-dev',
  'util-linux_base-dev',
  'linux-3.16.2_api_headers',
  'gcc_base-dev',
  'glibc_base-dev',
  'e2fsprogs_base-dev',
  'sed',
  'pkg-config',
  'patch',
  'make',
  'm4',
  'grep',
  'gmp',
  'mpfr',
  'mpc',
  'gcc_libs',
  'gcc_libs-dev',
  'isl',
  'cloog',
  'binutils',
  'gcc',
  'ncurses',
  'readline',
  'gawk',
  'flex',
  'findutils',
  'file',
  'diffutils',
  'bison',
  'compiletc'
].forEach(fetch)

function fetch(tcz) {
  dl(server + 'tcz/' + tcz + '.tcz').pipe(w(tcz + '.tcz'))
}

function w(f) { return fs.createWriteStream(path.join(out, f)) }
