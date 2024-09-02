var { spawnSync } = require('child_process')

module.exports = function spawn(cmd, options, ...args) {
  if (typeof options == 'string') {
    args = [options, ...args]
    options = null
  }

  var process = spawnSync(cmd, args, {
    shell: true,
    encoding: 'utf-8'
  })

  var { status, stdout, stderr } = process

  if (options?.silent != true) {
    if (stdout) {
      console.log(stdout)
    }
    if (stderr) {
      console.log(stderr)
    }
  }

  return {
    stdout: stdout?.toString(),
    stderr: status ? stderr?.toString() : null,
    code: status
  }
}
