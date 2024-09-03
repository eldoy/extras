var { execSync } = require('child_process')

module.exports = function exec(cmd, opt = {}) {
  opt.encoding ??= 'utf-8'
  try {
    var result = execSync(cmd, opt)
    if (!opt.silent) {
      console.info((result || '').toString())
    }
  } catch (e) {
    var result = e.stdio || e.stderr || ''
  }
  return result.trim()
}
