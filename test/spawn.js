var _ = require('../index.js')

function main() {
  var result = _.run('sh ./test/run.sh', { silent: true })
  // console.log(result)
}

main()
