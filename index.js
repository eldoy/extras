var fs = require('node:fs')
var path = require('node:path')
var os = require('node:os')
var util = require('node:util')
var crypto = require('node:crypto')
var readline = require('node:readline')
var { execSync } = require('node:child_process')

var lodash = require('lodash')
var { v4: uuidv4 } = require('uuid')
var cuid = require('@paralleldrive/cuid2').createId
var bcrypt = require('bcryptjs')
var yaml = require('js-yaml')

var NODE_EXTENSIONS = ['js', 'json', 'mjs', 'cjs', 'wasm', 'node']

var extras = {}

extras.NODE_EXTENSIONS = NODE_EXTENSIONS
extras.regexp = {}
extras.regexp.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
extras.regexp.id = /^[a-z0-9]{24,}$/
extras.regexp.reg = /^%r\/(.+)\/([ig]{0,2})/
extras.regexp.date =
  /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z?))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z?))$/
extras.regexp.url =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/
extras.regexp.slug = /^[a-z0-9-_]+$/
extras.regexp.ip = /^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/
extras.regexp.image = /\.(gif|jpe?g|tiff|png|bmp|svg)$/i
extras.regexp.domain =
  /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,61}?$/i

extras.regexp.subdomain = /^[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]$/
extras.uuid = uuidv4
extras.cuid = cuid
extras.lodash = lodash
extras.yaml = yaml

extras.exec = function (cmd, opt = {}) {
  opt.ecoding ??= 'utf8'
  opt.stdio ??= 'inherit'
  try {
    var output = execSync(cmd, opt)
  } catch (e) {
    var output = e.stdout?.toString() || e.stderr?.toString()
  }
  if (output) {
    return output.toString().trim()
  }
}

// Alias for exec for legacy apps
extras.run = util.deprecate(
  extras.exec,
  `run is deprecated, use exec instead`,
  `Deprecation API`
)

// Alias for exec that captures output
extras.capture = function (cmd, opt = {}) {
  opt.stdio = 'pipe'
  return extras.exec(cmd, opt)
}

// Alias for capture for legacy apps
extras.get = util.deprecate(
  extras.capture,
  `get is deprecated, use capture instead`,
  `Deprecation API`
)

extras.hash = function (str, saltRounds = 10) {
  return bcrypt.hashSync(String(str), saltRounds)
}

extras.md5 = function (str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

extras.hex = function (size = 20) {
  return crypto.randomBytes(size).toString('hex').slice(0, size)
}

extras.compare = function (plain, hash) {
  return bcrypt.compareSync(String(plain), String(hash))
}

extras.isEmail = function (str) {
  return extras.regexp.email.test(String(str))
}

extras.isId = function (str) {
  return extras.regexp.id.test(String(str))
}

extras.isRegExp = function (str) {
  return extras.regexp.reg.test(String(str))
}

extras.isDate = function (str) {
  if (typeof str == 'string') {
    return extras.regexp.date.test(String(str))
  }
  return lodash.isDate(str)
}

extras.isURL = function (str) {
  return extras.regexp.url.test(String(str))
}

extras.isBool = function (v) {
  return ['false', 'null', 'NaN', 'undefined', '0'].includes(v) ? false : !!v
}

// Alias for isBool for legacy apps
extras.parseBool = util.deprecate(
  extras.isBool,
  `parseBool is deprecated, use isBool instead`,
  `Deprecation API`
)

// Find object type
extras.type = function (obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
}

// Format and interpolate strings
extras.format = function (str, ...args) {
  for (var i = 0; i < args.length; i++) {
    var val = args[i]
    if (Array.isArray(val)) {
      val = val.join(', ')
    } else if (lodash.isPlainObject(val)) {
      val = Object.entries(val)
        .map((x) => x.join(': '))
        .join(', ')
    }
    str = str.replace('%s', val)
  }
  return str
}

// Print strings in-place
extras.print = function (str) {
  if (typeof str == 'object') {
    str = JSON.stringify(str)
  }
  try {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
  } catch (e) {
    readline.clearLine(process.stdout)
    readline.cursorTo(process.stdout, 0)
  }
  process.stdout.write(`${str}`)
}

// Inspect object
extras.inspect = function (obj, opt = {}) {
  var _obj = lodash.cloneDeep(obj)
  if (opt.exclude) {
    for (var opt of opt.exclude) {
      lodash.set(_obj, opt, null)
    }
  }
  var result = util.inspect(
    _obj,
    ({ showHidden = true, depth = null, colors = true } = opt)
  )
  if (!opt.quiet) {
    console.log(result)
  }
  return result
}

// Trim strings in object
extras.trim = function (obj) {
  for (var key in obj) {
    if (typeof obj[key] === 'object') {
      extras.trim(obj[key])
    } else if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim()
    }
  }
}

// Strip strings, multi-line support
extras.strip = function (str, sep = '\n') {
  return str
    .split(sep)
    .map((s) => s.trim())
    .join(sep)
}

// Transform object string values to Javascript native objects
extras.transform = function (obj, opt = {}) {
  var simple = typeof obj != 'object'
  if (simple) obj = [obj]

  function build(obj) {
    for (var k in obj) {
      if (obj[k] && typeof obj[k] === 'object') {
        extras.transform(obj[k])
      } else if (typeof obj[k] === 'string') {
        obj[k] = obj[k].trim()
        var m = obj[k].match(extras.regexp.reg)
        if (m) {
          obj[k] = new RegExp(m[1], m[2])
        }
        if (extras.isDate(obj[k]) && Date.parse(obj[k])) {
          obj[k] = new Date(obj[k])
        }
      }
    }
  }
  build(obj)

  return simple ? obj[0] : obj
}

// Convert values based on type
extras.convert = function (v, type) {
  switch (type) {
    case 'string':
      return String(v)
    case 'id':
      return String(v)
    case 'integer':
      return parseInt(v)
    case 'float':
      return parseFloat(v)
    case 'date':
      return new Date(v)
    case 'boolean':
      return extras.isBool(v)
    default:
      return v
  }
}

// Convert object to dot notation
extras.dot = function (obj, sep = '.') {
  var dotted = {}
  function build(obj, str) {
    for (var key in obj) {
      var trail = str ? `${str}${sep}${key}` : key
      if (lodash.isPlainObject(obj[key])) {
        build(obj[key], trail)
      } else {
        dotted[trail] = obj[key]
      }
    }
  }
  build(obj)
  return dotted
}

// Unpack object with dot notation
extras.undot = function (obj, sep = '.') {
  var un = {}
  function build(obj, str) {
    for (var key in obj) {
      var trail = str ? `${str}${sep}${key}` : key
      if (lodash.isPlainObject(obj[key])) {
        build(obj[key], trail)
      } else {
        lodash.set(un, trail, obj[key])
      }
    }
  }
  build(obj)
  return un
}

// Remove null and undefined from object, or optional types
extras.clean = function (data, ...types) {
  function match(val) {
    return (!types.length && val == null) || types.includes(extras.type(val))
  }

  function build(obj) {
    for (var key in obj) {
      if (obj[key] && typeof obj[key] == 'object') {
        build(obj[key])
      } else if (match(obj[key])) {
        if (Array.isArray(obj)) {
          obj.splice(key, 1)
        } else {
          delete obj[key]
        }
      }
    }
  }
  build(data)
  return data
}

// Get base and extension
extras.basext = function (file) {
  var name = path.basename(file)
  var base = name
  var ext = ''
  if (name.includes('.')) {
    base = name.split('.').slice(0, -1).join('.')
    ext = name.split('.').slice(-1).join('')
  }
  return [base, ext, name]
}

// Turn a string into a valid slug for web addresses
extras.slug = function (string) {
  var a =
    'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
  var b =
    'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
  var p = new RegExp(a.split('').join('|'), 'g')

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Check if file exists
extras.exist = function (file) {
  file = extras.resolve(file)
  return fs.existsSync(file)
}

// Read file
extras.read = function (file, encoding) {
  file = extras.resolve(file)
  var [base, ext] = extras.basext(file)
  if (
    NODE_EXTENSIONS.includes(encoding) ||
    (!encoding && NODE_EXTENSIONS.includes(ext))
  ) {
    return require(file)
  }
  var content = fs.readFileSync(file, encoding || 'utf8')
  if (encoding == 'yml' || (!encoding && ext == 'yml')) {
    return yaml.load(content) || {}
  }
  return content
}

// Write file
extras.write = function (file, content) {
  file = extras.resolve(file)
  if (Array.isArray(content) || lodash.isPlainObject(content)) {
    if (file.endsWith('.json')) {
      content = JSON.stringify(content)
    } else if (file.endsWith('.yml')) {
      content = yaml.dump(content)
    }
  }
  var dirname = path.dirname(file)
  extras.exec(`mkdir -p ${dirname}`)
  return fs.writeFileSync(file, content)
}

// Append to file
extras.append = function (file, content) {
  file = extras.resolve(file)
  return fs.appendFileSync(file, content)
}

// Edit file
extras.edit = function (file, fn) {
  file = extras.resolve(file)
  var content = extras.read(file, 'utf8')
  var result = fn(content) || ''
  extras.write(file, result)
}

// Exit program
extras.exit = function (msg, code = 1) {
  console.log(msg)
  process.exit(code)
}

// Get terminal input
extras.input = async function (prompt = '> ', opt = {}) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    ...opt
  })
  return await new Promise(function (resolve) {
    rl.question(prompt, function (str) {
      rl.close()
      resolve(str)
    })
  })
}

// Get keypress from stdin
extras.key = function (fn) {
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.on('keypress', fn)
}

// Read directory
extras.dir = function (file) {
  file = extras.resolve(file)
  return fs.readdirSync(file)
}

// Is directory?
extras.isDir = function (file) {
  file = extras.resolve(file)
  try {
    return fs.lstatSync(file).isDirectory()
  } catch (e) {
    return false
  }
}

// Is file?
extras.isFile = function (file) {
  file = extras.resolve(file)
  try {
    return fs.lstatSync(file).isFile()
  } catch (e) {
    return false
  }
}

// Is symbolic link?
extras.isSymlink = function (file) {
  file = extras.resolve(file)
  try {
    return fs.lstatSync(file).isSymbolicLink()
  } catch (e) {
    return false
  }
}

// Resolve path
extras.resolve = function (...dirs) {
  var file = dirs.join(path.sep)
  if (file.startsWith(`.${path.sep}`)) {
    file = file.replace('.', process.cwd())
  } else if (file.startsWith('~')) {
    file = file.replace('~', os.homedir())
  } else if (!file.startsWith(path.sep)) {
    file = path.join(process.cwd(), file)
  }
  return path.resolve(file)
}

// Walk directory tree
extras.walk = function (dirname, fn) {
  extras.dir(dirname).forEach((f) => {
    var file = path.join(dirname, f)
    if (extras.isDir(file)) {
      extras.walk(file, fn)
    } else {
      fn(file, dirname)
    }
  })
}

// Directory tree as flat array
extras.tree = function (root) {
  root = extras.resolve(root)
  if (!extras.exist(root)) return []
  var files = []
  extras.walk(root, function (file) {
    files.push(file)
  })
  return files
}

// Sort by number
extras.sortByNumber = function (arr, fn) {
  if (!fn) {
    fn = (a, b) => (a.match(/^\d+/g) || a) - (b.match(/^\d+/g) || b)
  }
  return arr.sort(fn)
}

// Sleep
extras.sleep = function (s = 1) {
  return new Promise((r) => setTimeout(r, s * 1000))
}

// Env
extras.env = function (file, mode) {
  var content = {}
  if (extras.exist(file)) {
    content = extras.read(file)
  }
  // Merge environment file content
  if (typeof content == 'object') {
    var [base, ext] = extras.basext(file)
    var name = file.replace(`.${ext}`, `.${mode}.${ext}`)
    if (extras.exist(name)) {
      var data = extras.read(name)
      lodash.mergeWith(content, data, function (obj, src) {
        if (lodash.isArray(obj)) {
          return obj.concat(src)
        }
      })
    }
  }
  return content
}

module.exports = extras
