var { execSync } = require('child_process')

module.exports = function exec(cmd, opt = {}) {
  try {
    var result = execSync(cmd, { encoding: 'utf-8' })
    if (!opt.silent) {
      console.info((result || '').toString())
    }
  } catch (e) {
    var result = e.stdio || e.stderr || ''
  }
  return result.trim()
}
