var { exec } = require('../index.js')

var result = exec('ls -la')
console.log({ result })

// var result = exec('ls -la', { silent: true })
// console.log({ result })

// var result = exec('ls-la')
// console.log({ result })

// var result = exec('ls-la', { silent: true })
// console.log({ result })
