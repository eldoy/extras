const extras = require('../index.js')
const os = require('os')

describe('extras', () => {
  it('should format a string', async () => {
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

  it('should should transform a string', async () => {
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
  })

  it('should md5 hash a string', async () => {
    let result = extras.md5('hello')
    expect(result).toBe('5d41402abc4b2a76b9719d911017c592')
  })

  it('should generate a uuid', async () => {
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

  it('should resolve paths', async () => {
    let result = extras.resolve(__dirname)
    expect(result).toBe(__dirname)

    result = extras.resolve('..', 'test')
    expect(result.endsWith('/test')).toBe(true)

    result = extras.resolve('~')
    expect(result).toBe(os.homedir())

    result = extras.resolve('test')
    expect(result.endsWith('/test')).toBe(true)
  })
})
