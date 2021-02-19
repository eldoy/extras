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

const NODE_EXTENSIONS = ['js', 'json', 'mjs', 'cjs', 'wasm', 'node']

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

extras.hex = function(size = 20) {
  return crypto.randomBytes(size).toString('hex')
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

// Strip strings, multi-line support
extras.strip = function(str, sep = '\n') {
  return str.split(sep).map(s => s.trim()).join(sep)
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
extras.name = function(file) {
  const name = path.basename(file)
  const base = name.split('.').slice(0, -1).join('.')
  const ext = name.split('.').slice(-1).join('')
  return [base, ext, name]
}

// Turn a string into a valid slug for web addresses
extras.slug = function(string) {
  const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
  const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(p, c => b.charAt(a.indexOf(c)))
  .replace(/&/g, '-and-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '')
}

// Check if file exists
extras.exist = function(file) {
  file = extras.resolve(file)
  return fs.existsSync(file)
}

// Read file
extras.read = function(file, encoding) {
  file = extras.resolve(file)
  const [base, ext] = extras.name(file)
  if (NODE_EXTENSIONS.includes(encoding) || !encoding && NODE_EXTENSIONS.includes(ext)) {
    return require(file)
  }
  const content = fs.readFileSync(file, encoding || 'utf8')
  if (encoding == 'yml' || !encoding && ext == 'yml') {
    return yaml.load(content) || {}
  }
  return content
}

// Write file
extras.write = function(file, content) {
  file = extras.resolve(file)
  if (_.isPlainObject(content)) {
    if (file.endsWith('.json')) {
      content = JSON.stringify(content)
    } else if (file.endsWith('.yml')) {
      content = yaml.dump(content)
    }
  }
  return fs.writeFileSync(file, content)
}

// Append to file
extras.append = function(file, content) {
  file = extras.resolve(file)
  return fs.appendFileSync(file, content)
}

// Edit file
extras.edit = function(file, fn) {
  file = extras.resolve(file)
  const content = extras.read(file, 'utf8')
  const result = fn(content) || ''
  extras.write(file, result)
}

// Read directory
extras.dir = function(file) {
  file = extras.resolve(file)
  return fs.readdirSync(file)
}

// Copy files
extras.copy = function(from, to) {
  from = extras.resolve(from)
  to = extras.resolve(to)
  return sh.cp('-R', from, to)
}

// Is directory?
extras.isDir = function(file) {
  file = extras.resolve(file)
  try {
    return fs.lstatSync(file).isDirectory()
  } catch (e) {
    return false
  }
}

// Is file?
extras.isFile = function(file) {
  file = extras.resolve(file)
  try {
    return fs.lstatSync(file).isFile()
  } catch (e) {
    return false
  }
}

// Run command
extras.run = function(command, options = {}) {
  return sh.exec(command, options)
}

// Make directory
extras.mkdir = function(...dirs) {
  return sh.mkdir('-p', ...dirs)
}

// Remove directory
extras.rmdir = function(...dirs) {
  return sh.rm('-rf', ...dirs)
}

// Rename file
extras.rename = function(from, to) {
  from = extras.resolve(from)
  to = extras.resolve(to)
  if (extras.exist(from)) {
    return sh.mv(from, to)
  }
}

// Resolve path
extras.resolve = function(...dirs) {
  let file = dirs.join(path.sep)
  if (file.startsWith('.')) {
    file = file.replace('.', process.cwd())
  } else if (file.startsWith('~')) {
    file = file.replace('~', os.homedir())
  } else if (!file.startsWith(path.sep)) {
    file = path.join(process.cwd(), file)
  }
  return path.resolve(file)
}

extras.walk = function(dir, fn) {
  extras.dir(dir).forEach(f => {
    const file = path.join(dir, f)
    if(extras.isDir(file)){
      extras.walk(file, fn)
    } else {
      fn(file, dir)
    }
  })
}

// Directory tree as flat array
extras.tree = function(root) {
  root = extras.resolve(root)
  if (!extras.exist(root)) return []
  const files = []
  extras.walk(root, function(file) {
    files.push(file)
  })
  return files
}

// Sort by number
extras.sortByNumber = function(arr, fn) {
  if (!fn) {
    fn = (a, b) => (a.match(/^\d+/g) || a) - (b.match(/^\d+/g) || b)
  }
  return arr.sort(fn)
}

// Sleep
extras.sleep = function(s = 1) {
  return new Promise(r => setTimeout(r, s / 1000))
}

module.exports = extras
