var extras = require('../../index.js')
var os = require('node:os')
var util = require('node:util')

it('should format a string', ({ t }) => {
  var result = extras.format('hello')
  t.equal(result, 'hello')

  result = extras.format('hello', 5)
  t.equal(result, 'hello')

  result = extras.format('hello %s', 5)
  t.equal(result, 'hello 5')

  result = extras.format('hello %s %s', 5)
  t.equal(result, 'hello 5 %s')

  result = extras.format('hello %s %s', 5, 'hello')
  t.equal(result, 'hello 5 hello')

  result = extras.format('hello %s', [1, 2, 3])
  t.equal(result, 'hello 1, 2, 3')

  result = extras.format('hello %s', { name: 'hello', key: 'a' })
  t.equal(result, 'hello name: hello, key: a')

  result = extras.format('hello %s', false)
  t.equal(result, 'hello false')

  result = extras.format('hello %s', true)
  t.equal(result, 'hello true')
})

it('should transform a string', ({ t }) => {
  var params = { hello: 'something' }
  extras.transform(params)
  t.equal(params.hello, 'something')

  params = { hello: 'Hello! 2' }
  extras.transform(params)
  t.equal(params.hello, 'Hello! 2')

  params = { hello: '2020-11-02T08:22:31.017Z' }
  extras.transform(params)
  t.equal(typeof params.hello.getMonth, 'function')

  params = { hello: '2020-11-02T08:22:31Z' }
  extras.transform(params)
  t.equal(typeof params.hello.getMonth, 'function')

  params = { hello: '2022-03-18T08:24:34' }
  extras.transform(params)
  t.equal(typeof params.hello.getMonth, 'function')

  params = { hello: '2024-07-21T13:59:15.307' }
  extras.transform(params)
  t.equal(typeof params.hello.getMonth, 'function')

  params = { val: '%r/hello/' }
  extras.transform(params)
  t.equal(extras.type(params.val), 'regexp')

  result = extras.transform('hello')
  t.equal(result, 'hello')

  params = { val: '5' }
  extras.transform(params)
  t.equal(params.val, '5')

  params = { val: 'null' }
  extras.transform(params)
  t.equal(params.val, 'null')

  params = { val: 'true' }
  extras.transform(params)
  t.equal(params.val, 'true')

  params = { val: 'false' }
  extras.transform(params)
  t.equal(params.val, 'false')
})

it('should md5 hash a string', ({ t }) => {
  var result = extras.md5('hello')
  t.equal(result, '5d41402abc4b2a76b9719d911017c592')
})

it('should generate a uuid', ({ t }) => {
  var result = extras.uuid()
  t.equal(typeof result, 'string')
  t.equal(result.length, 36)
})

it('should show a directory tree', ({ t }) => {
  var tree = extras.tree('spec')
  t.equal(tree.length > 0, true)
  t.equal(Array.isArray(tree), true)
})

it('should give empty tree if not exist', ({ t }) => {
  var tree = extras.tree('doesnotexist')
  t.equal(tree.length === 0, true)
  t.equal(Array.isArray(tree), true)
})

it('should resolve paths', ({ t }) => {
  var result = extras.resolve(__dirname)
  t.equal(result, __dirname)

  result = extras.resolve('..', 'test')
  t.equal(result.endsWith('/test'), true)

  result = extras.resolve('~')
  t.equal(result, os.homedir())

  result = extras.resolve('test')
  t.equal(result.endsWith('/test'), true)
})

it('should read files', ({ t }) => {
  var result = extras.read('spec/assets/file.txt')
  t.equal(result, 'hello')

  result = extras.read('spec/assets/file.yml')
  t.deepStrictEqual(result, { hello: 1 })

  result = extras.read('spec/assets/file.json')
  t.deepStrictEqual(result, { hello: 1 })

  result = extras.read('spec/assets/file.js')
  t.deepStrictEqual(result, { hello: 1 })
})

it('should sort by number', ({ t }) => {
  var arr = ['11-a', '1000-b', '10-c']
  var result = extras.sortByNumber(arr.slice())
  t.deepStrictEqual(result, ['10-c', '11-a', '1000-b'])

  result = extras.sortByNumber(arr.slice(), function (a, b) {
    return (b.match(/^\d+/g) || b) - (a.match(/^\d+/g) || a)
  })
  t.deepStrictEqual(result, ['10-c', '11-a', '1000-b'].reverse())
})

it('should strip a string', ({ t }) => {
  var result = extras.strip('hello')
  t.equal(result, 'hello')

  result = extras.strip(' hello ')
  t.equal(result, 'hello')

  result = extras.strip('hello what')
  t.equal(result, 'hello what')

  result = extras.strip('hello what | nesten', '|')
  t.equal(result, 'hello what|nesten')

  result = extras.strip('hello what\n\n linje  ')
  t.equal(result, 'hello what\n\nlinje')
})

it('should get a file name and extension', ({ t }) => {
  var [base1, ext1, name1] = extras.basext('/a/b/test.js')
  t.equal(base1, 'test')
  t.equal(ext1, 'js')
  t.equal(name1, 'test.js')

  var [base2, ext2, name2] = extras.basext('/a/b/hello.test.yml')
  t.equal(base2, 'hello.test')
  t.equal(ext2, 'yml')
  t.equal(name2, 'hello.test.yml')

  var [base3, ext3, name3] = extras.basext('/src/waveorb-generate')
  t.equal(base3, 'waveorb-generate')
  t.equal(ext3, '')
  t.equal(name3, 'waveorb-generate')
})

it('should convert an object to dot notation', ({ t }) => {
  var obj = { a: { b: { c: 1, d: /regex/ } } }
  var res = extras.dot(obj)
  t.equal(res['a.b.c'], 1)
  t.ok(res['a.b.d'] != undefined)
  var res2 = extras.dot(obj, '/')
  t.equal(res2['a/b/c'], 1)
})

it('should undot a dotted object', ({ t }) => {
  var result = extras.undot({})
  t.deepStrictEqual(result, {})

  result = extras.undot({ name: 'hello' })
  t.deepStrictEqual(result, { name: 'hello' })

  result = extras.undot({ 'name.harald': 'hello' })
  t.deepStrictEqual(result, { name: { harald: 'hello' } })

  result = extras.undot({
    names: {
      'harald.email': 'hello@test.no'
    }
  })
  t.deepStrictEqual(result, {
    names: {
      harald: {
        email: 'hello@test.no'
      }
    }
  })
})

it('should clean an object', ({ t }) => {
  var data = {
    a: null,
    b: {
      c: null,
      d: 1
    },
    e: [1, 2, null, 3],
    f: undefined,
    g: 'hello'
  }

  var obj = extras.clean({ ...data })
  t.equal(obj.a, undefined)
  t.equal(obj.b.c, undefined)
  t.equal(obj.b.d, 1)
  t.equal(obj.e[0], 1)
  t.equal(obj.e[1], 2)
  t.equal(obj.e[2], 3)
  t.equal(obj.f, undefined)
  t.equal(obj.g, 'hello')
  t.equal(Object.keys(obj).length, 3)

  obj = extras.clean({ ...data }, 'null')
  t.equal(Object.keys(obj).length, 4)

  obj = extras.clean({ ...data }, 'string')
  t.equal(Object.keys(obj).length, 4)
})

it('should find the object type', ({ t }) => {
  var result = extras.type('hello')
  t.equal(result, 'string')

  result = extras.type(5)
  t.equal(result, 'number')

  result = extras.type(5.0)
  t.equal(result, 'number')

  result = extras.type(NaN)
  t.equal(result, 'number')

  result = extras.type(/hello/)
  t.equal(result, 'regexp')

  result = extras.type()
  t.equal(result, 'undefined')

  result = extras.type(true)
  t.equal(result, 'boolean')

  result = extras.type(false)
  t.equal(result, 'boolean')

  result = extras.type(new Date())
  t.equal(result, 'date')
})

it('should return empty config if file does not exist', ({ t }) => {
  var result = extras.env('spec/assets/not.json', 'production')
  t.equal(typeof result, 'object')
})

it('should read and merge env files', ({ t }) => {
  var result = extras.env('spec/assets/env.json', 'production')
  t.equal(result.hello, 3)
})

it('should not read and merge files without env', ({ t }) => {
  var result = extras.env('spec/assets/unenv.json', 'production')
  t.equal(result.hello, 1)
})

it('should match domain regexp', ({ t }) => {
  var result = extras.regexp.domain.test('eldoy.com')
  t.equal(result, true)

  result = extras.regexp.domain.test('www.eldoy.com')
  t.equal(result, true)

  result = extras.regexp.domain.test('http://eldoy.com')
  t.equal(result, false)
})

it('should generate a hex', ({ t }) => {
  var result = extras.hex()
  t.equal(result.length, 20)

  result = extras.hex(9)
  t.equal(result.length, 9)
})

it('should exec command', async ({ t }) => {
  var result = extras.exec('ls -la', { stdio: 'pipe' })
  t.ok(result.startsWith('total'))
})

it('should capture command', async ({ t }) => {
  var result = extras.capture('ls -la')
  t.ok(result.startsWith('total'))
})
