var spawn = require('./spawn.js')

function cp(options = '', from, to) {
  return spawn('cp', { silent: true }, options, from, to)
}

function exec(command, options) {
  return spawn(command, options)
}

function mkdir(options = '', ...files) {
  return spawn('mkdir', { silent: true }, options, ...files)
}

function mv(from, to) {
  return spawn('mv', { silent: true }, from, to)
}

function rm(options = '', ...files) {
  return spawn('rm', { silent: true }, options, ...files)
}

module.exports = { cp, exec, mkdir, mv, rm }
