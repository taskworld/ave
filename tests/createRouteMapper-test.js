
import createRouteMapper from '../src/createRouteMapper'
import assert from 'assert'

describe('createRouteMapper', function () {
  describe('resolve', function () {
    it('resolves route', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        great: { route: '/great' },
      })
      assert.deepEqual(mapper.resolve('/'), { name: 'home', options: { } })
    })
    it('resolves parameterized route', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        task: { route: '/task/:taskId' },
      })
      assert.deepEqual(mapper.resolve('/task/99'), { name: 'task', options: { taskId: '99' } })
    })
    it('resolves alias', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        task: { route: '/task/:taskId', aliases: [ '/:taskId'] },
      })
      assert.deepEqual(mapper.resolve('/99'), { name: 'task', options: { taskId: '99' } })
    })
    it('resolves redirects', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        task: {
          route: '/task/:taskId',
          redirect: ({ taskId }) => ({ name: 'home', options: { taskId, mode: 'task' } })
        },
      })
      assert.deepEqual(mapper.resolve('/task/99'), { name: 'home', options: { taskId: '99', mode: 'task' } })
    })
  })
  describe('generate', function () {
    it('generates route', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        great: { route: '/great' },
      })
      assert(mapper.generate({ name: 'home', options: { } }) === '/')
    })
    it('generates parameterized route', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        task: { route: '/task/:taskId' },
      })
      assert(mapper.generate({ name: 'task', options: { taskId: '99' } }) === '/task/99')
    })
    it('leaves slashes alone', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
      })
      assert(mapper.generate({ name: 'home', options: { show: '/wow' } }) === '/?show=/wow')
    })
    it('adds to query string if param does not match any named route', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        task: { route: '/task/:taskId' },
      })
      assert(mapper.generate({ name: 'home', options: { taskId: '99' } }) === '/?taskId=99')
    })
    it('formats route that redirects to same route', function () {
      const mapper = createRouteMapper({
        home: { route: '/' },
        welcome: { route: '/welcome',
          redirect: () => ({ name: 'task', options: { taskId: '0' } })
        },
        task: { route: '/task/:taskId',
          format: ({ taskId }) => taskId === '0' && { name: 'welcome', options: { } }
        },
      })
      assert(mapper.generate({ name: 'task', options: { taskId: '99' } }) === '/task/99')
      assert(mapper.generate({ name: 'task', options: { taskId: '0' } }) === '/welcome')
    })
  })
})
