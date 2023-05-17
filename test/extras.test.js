const extras = require('../index.js')
const os = require('os')

describe('extras', () => {
  it('should format a string', () => {
    let result = extras.format('hello')
    expect(result).toBe('hello')

    result = extras.format('hello', 5)
    expect(result).toBe('hello')

    result = extras.format('hello %s', 5)
    expect(result).toBe('hello 5')

    result = extras.format('hello %s %s', 5)
    expect(result).toBe('hello 5 %s')

    result = extras.format('hello %s %s', 5, 'hello')
    expect(result).toBe('hello 5 hello')

    result = extras.format('hello %s', [1, 2, 3])
    expect(result).toBe('hello 1, 2, 3')

    result = extras.format('hello %s', { name: 'hello', key: 'a' })
    expect(result).toBe('hello name: hello, key: a')

    result = extras.format('hello %s', false)
    expect(result).toBe('hello false')

    result = extras.format('hello %s', true)
    expect(result).toBe('hello true')
  })

  it('should should transform a string', () => {
    let params = { hello: 'something' }
    extras.transform(params)
    expect(params.hello).toBe('something')

    params = { hello: 'Hello! 2' }
    extras.transform(params)
    expect(params.hello).toBe('Hello! 2')

    params = { hello: '2020-11-02T08:22:31.017Z' }
    extras.transform(params)
    expect(typeof params.hello.getMonth).toBe('function')

    params = { hello: '2020-11-02T08:22:31Z' }
    extras.transform(params)
    expect(typeof params.hello.getMonth).toBe('function')

    params = { val: '%r/hello/' }
    extras.transform(params)
    expect(extras.type(params.val)).toBe('regexp')

    result = extras.transform('hello')
    expect(result).toBe('hello')

    params = { val: '5' }
    extras.transform(params)
    expect(params.val).toBe('5')

    params = { val: 'null' }
    extras.transform(params)
    expect(params.val).toBe('null')

    params = { val: 'true' }
    extras.transform(params)
    expect(params.val).toBe('true')

    params = { val: 'false' }
    extras.transform(params)
    expect(params.val).toBe('false')
  })

  it('should md5 hash a string', () => {
    let result = extras.md5('hello')
    expect(result).toBe('5d41402abc4b2a76b9719d911017c592')
  })

  it('should generate a uuid', () => {
    let result = extras.uuid()
    expect(typeof result).toBe('string')
    expect(result.length).toBe(36)
  })

  it('should show a directory tree', () => {
    let tree = extras.tree('test')
    expect(tree.length > 0).toBe(true)
    expect(Array.isArray(tree)).toBe(true)
  })

  it('should give empty tree if not exist', () => {
    let tree = extras.tree('doesnotexist')
    expect(tree.length === 0).toBe(true)
    expect(Array.isArray(tree)).toBe(true)
  })

  it('should resolve paths', () => {
    let result = extras.resolve(__dirname)
    expect(result).toBe(__dirname)

    result = extras.resolve('..', 'test')
    expect(result.endsWith('/test')).toBe(true)

    result = extras.resolve('~')
    expect(result).toBe(os.homedir())

    result = extras.resolve('test')
    expect(result.endsWith('/test')).toBe(true)
  })

  it('should read files', () => {
    let result = extras.read('test/assets/file.txt')
    expect(result).toEqual('hello')

    result = extras.read('test/assets/file.yml')
    expect(result).toEqual({ hello: 1 })

    result = extras.read('test/assets/file.json')
    expect(result).toEqual({ hello: 1 })

    result = extras.read('test/assets/file.js')
    expect(result).toEqual({ hello: 1 })
  })

  it('should sort by number', () => {
    let t = ['11-a', '1000-b', '10-c']
    let result = extras.sortByNumber(t.slice())
    expect(result).toEqual(['10-c', '11-a', '1000-b'])

    result = extras.sortByNumber(t.slice(), function (a, b) {
      return (b.match(/^\d+/g) || b) - (a.match(/^\d+/g) || a)
    })
    expect(result).toEqual(['10-c', '11-a', '1000-b'].reverse())
  })

  it('should strip a string', () => {
    let result = extras.strip('hello')
    expect(result).toBe('hello')

    result = extras.strip(' hello ')
    expect(result).toBe('hello')

    result = extras.strip('hello what')
    expect(result).toBe('hello what')

    result = extras.strip('hello what | nesten', '|')
    expect(result).toBe('hello what|nesten')

    result = extras.strip('hello what\n\n linje  ')
    expect(result).toBe('hello what\n\nlinje')
  })

  it('should get a file name and extension', () => {
    const [base1, ext1, name1] = extras.basext('/a/b/test.js')
    expect(base1).toBe('test')
    expect(ext1).toBe('js')
    expect(name1).toBe('test.js')

    const [base2, ext2, name2] = extras.basext('/a/b/hello.test.yml')
    expect(base2).toBe('hello.test')
    expect(ext2).toBe('yml')
    expect(name2).toBe('hello.test.yml')

    const [base3, ext3, name3] = extras.basext('/src/waveorb-generate')
    expect(base3).toBe('waveorb-generate')
    expect(ext3).toBe('')
    expect(name3).toBe('waveorb-generate')
  })

  it('should convert an object to dot notation', async () => {
    var obj = { a: { b: { c: 1, d: /regex/ } } }
    const res = extras.dot(obj)
    expect(res['a.b.c']).toBe(1)
    expect(res['a.b.d']).toBeDefined()
    const res2 = extras.dot(obj, '/')
    expect(res2['a/b/c']).toBe(1)
  })

  it('should undot a dotted object', async () => {
    let result = extras.undot({})
    expect(result).toEqual({})

    result = extras.undot({ name: 'hello' })
    expect(result).toEqual({ name: 'hello' })

    result = extras.undot({ 'name.harald': 'hello' })
    expect(result).toEqual({ name: { harald: 'hello' } })

    result = extras.undot({
      names: {
        'harald.email': 'hello@test.no'
      }
    })
    expect(result).toEqual({
      names: {
        harald: {
          email: 'hello@test.no'
        }
      }
    })
  })

  it('should clean an object', async function () {
    let data = {
      a: null,
      b: {
        c: null,
        d: 1
      },
      e: [1, 2, null, 3],
      f: undefined,
      g: 'hello'
    }

    let obj = extras.clean({ ...data })
    expect(obj.a).toBeUndefined()
    expect(obj.b.c).toBeUndefined()
    expect(obj.b.d).toBe(1)
    expect(obj.e[0]).toBe(1)
    expect(obj.e[1]).toBe(2)
    expect(obj.e[2]).toBe(3)
    expect(obj.f).toBeUndefined()
    expect(obj.g).toBe('hello')
    expect(Object.keys(obj).length).toBe(3)

    obj = extras.clean({ ...data }, 'null')
    expect(Object.keys(obj).length).toBe(4)

    obj = extras.clean({ ...data }, 'string')
    expect(Object.keys(obj).length).toBe(4)
  })

  it('should find the object type', async function () {
    let result = extras.type('hello')
    expect(result).toBe('string')

    result = extras.type(5)
    expect(result).toBe('number')

    result = extras.type(5.0)
    expect(result).toBe('number')

    result = extras.type(NaN)
    expect(result).toBe('number')

    result = extras.type(/hello/)
    expect(result).toBe('regexp')

    result = extras.type()
    expect(result).toBe('undefined')

    result = extras.type(true)
    expect(result).toBe('boolean')

    result = extras.type(false)
    expect(result).toBe('boolean')

    result = extras.type(new Date())
    expect(result).toBe('date')
  })

  it('should read and merge env files', async function () {
    let result = extras.env('test/assets/env.json', 'production')
    expect(result.hello).toEqual(3)
  })

  it('should not read and merge files without env', async function () {
    let result = extras.env('test/assets/unenv.json', 'production')
    expect(result.hello).toEqual(1)
  })
})
