const fs = require('fs')
const path = require('path')
const os = require('os')
const util = require('util')
const crypto = require('crypto')
const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
const cuid = require('cuid')
const bcrypt = require('bcryptjs')
const yaml = require('js-yaml')
const sh = require('shelljs')

const extras = {}
extras.regexp = {}
extras.regexp.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
extras.regexp.id = /^[a-z0-9]{24,}$/
extras.regexp.reg = /^%r\/(.+)\/([ig]{0,2})/
extras.regexp.date = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/
extras.regexp.url = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

extras.uuid = uuidv4
extras.cuid = cuid

extras.hash = function(str, saltRounds = 10) {
  return bcrypt.hashSync(String(str), saltRounds)
}

extras.md5 = function(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

extras.compare = function(plain, hash) {
  return bcrypt.compareSync(String(plain), String(hash))
}

extras.isEmail = function(str) {
  return extras.regexp.email.test(String(str))
}

extras.isId = function(str) {
  return extras.regexp.id.test(String(str))
}

extras.isRegExp = function(str) {
  return extras.regexp.reg.test(String(str))
}

extras.isDate = function(str) {
  return extras.regexp.date.test(String(str))
}

extras.isURL = function(str) {
  return extras.regexp.url.test(String(str))
}

extras.isBoolean = function(v) {
  return ['false', 'null', 'NaN', 'undefined', '0'].includes(v) ? false : !!v
}

// Format and interpolate strings
extras.format = function(str, ...args) {
  for (let i = 0; i < args.length; i++) {
    let val = args[i]
    if (Array.isArray(val)) {
      val = val.join(', ')
    } else if (_.isPlainObject(val)) {
      val = Object.entries(val).map(x => x.join(': ')).join(', ')
    }
    str = str.replace('%s', val)
  }
  return str
}

// Inspect object
extras.inspect = function(obj, options = {}) {
  const _obj = _.cloneDeep(obj)
  if (options.exclude) {
    for (const opt of options.exclude) {
      _.set(_obj, opt, null)
    }
  }
  const result = util.inspect(_obj, { showHidden = true, depth = null, colors = true } = options)
  if (!options.quiet) {
    console.log(result)
  }
  return result
}

// Trim strings in object
extras.trim = function(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      extras.trim(obj[key])
    } else if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim()
    }
  }
}

// Transform JSON string nodes to Javascript native objects
extras.transform = function(node) {
  for (const k in node) {
    if (node[k] && typeof node[k] === 'object') {
      extras.transform(node[k])
    } else if (typeof node[k] === 'string') {
      node[k] = node[k].trim()
      if (extras.isDate(node[k]) && Date.parse(node[k])) {
        node[k] = new Date(node[k])
      } else if (node[k].match(extras.regexp.reg)) {
        node[k] = new RegExp(RegExp.$1, RegExp.$2)
      }
    }
  }
}

// Convert values based on type
extras.convert = function(v, type) {
  switch (type) {
    case 'string': return String(v)
    case 'id': return String(v)
    case 'integer': return parseInt(v)
    case 'float': return parseFloat(v)
    case 'date': return new Date(v)
    case 'boolean': return extras.isBoolean(v)
    default: return v
  }
}

// Get name and extension
extras.split = function(file) {
  return path.basename(file).split('.')
}

// Check if file exists
extras.exist = function(file) {
  return file ? fs.existsSync(file) : false
}

// Read file
extras.read = function(file) {
  return fs.readFileSync(file, 'utf8')
}

// Write file
extras.write = function(file, str) {
  return fs.writeFileSync(file, str)
}

// Append to file
extras.append = function(name, content) {
  return fs.appendFileSync(name, content)
}

// Read yaml file
extras.ryml = function(file) {
  return yaml.load(extras.read(file)) || {}
}

// Write yaml file
extras.wyml = function(file, obj) {
  return extras.write(file, yaml.dump(obj))
}

// Read directory
extras.dir = function(file) {
  const files = fs.readdirSync(file)
  return extras.sortByNumber(files).map(f => path.join(file, f))
}

// Is directory?
extras.isDir = function(file) {
  return fs.lstatSync(file).isDirectory()
}

// Is file?
extras.isFile = function(name) {
  return fs.lstatSync(name).isFile()
}

// Run command
extras.run = function(command) {
  return sh.exec(command)
}

// Make directory
extras.mkdir = function(...names) {
  return sh.mkdir('-p', ...names)
}

// Remove directory
extras.rmdir = function(...names) {
  return sh.rm('-rf', ...names)
}

// Rename file
extras.rename = function(from, to) {
  if (extras.exist(from)) {
    return sh.mv(from, to)
  }
}

// Resolve path
extras.resolve = function(...dirs) {
  let file = dirs.join(path.sep)
  if (file.startsWith('~')) {
    file = file.replace('~', os.homedir())
  } else if (!file.startsWith(path.sep)) {
    file = path.join(process.cwd(), file)
  }
  return path.resolve(file)
}

// Directory tree as flat array
extras.tree = function(root) {
  root = extras.resolve(root)
  if (!extras.exist(root)) return []
  function glob(dir, files) {
    fs.readdirSync(dir).forEach(file => {
      const subpath = path.join(dir, file)
      if(extras.isDir(subpath)){
        glob(subpath, files)
      } else {
        files.push(subpath)
      }
    })
  }
  const files = []
  glob(root, files)
  return files
}

// Sort by number
extras.sortByNumber = function(arr) {
  return arr.sort((a, b) => (a.match(/^\d+/g) || a) - (b.match(/^\d+/g) || b))
}

module.exports = extras
