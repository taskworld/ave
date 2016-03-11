# ave

Flexible JavaScript URL router.

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

[build-badge]: https://img.shields.io/travis/taskworld/ave/master.svg?style=flat-square
[build]: https://travis-ci.org/taskworld/ave

[npm-badge]: https://img.shields.io/npm/v/ave.svg?style=flat-square
[npm]: https://www.npmjs.org/package/ave

[coveralls-badge]: https://img.shields.io/coveralls/taskworld/ave/master.svg?style=flat-square
[coveralls]: https://coveralls.io/github/taskworld/ave

A Taskworld, our frontend is very complex. Many parts can be affected by the URL independently.
The URLs in the app has gone through several iterations and efforts need to be made to ensure backwards compatibility.
ave is created to handle all our routing needs.
This library is based on `url-mapper` and `uniloc` project.


## Usage

```js
import { createRouteMapper } from 'ave'
```

### createRouteMapper(routeDefinitions)

Give it an dictionary of Route Definition Objects, and it will create a Route Mapper.

- `routes` An Object whose keys are route name and values are Route Definition Objects, each contains these keys:
  - `route` (required) A String representing the route. They can have placeholders. e.g.: `/project/:projectAltId`
  - `aliases` An Array of String that contains the possible aliases for this route.
  - `redirect` A Function which will redirect this route to another route during route resolution.
  - `format` A Function which will redirect this route to another route during URL generation.
    To protect against bugs, the resulting route must redirect back to this route.

Redirect and format is an advanced feature, which will be discussed later.
Here’s an example router.

```js
const simpleRouter = createRouteMapper([
  home: { route: '/' },
  about: { route: '/about' },
  post: { route: '/posts/:postId', aliases: [ '/forum/post/:postId' ] },
])
```

### RouteMapper#resolve(path)

Resolves the `path` String into a Route Object.

- `path` A String representing the path to resolve.
- __Returns__ a Route Object with these keys:
  - `name` A String representing the route’s name.
  - `options` An Object containing the options from placeholders or query.
- __Returns__ `null` if desired route is not found.

```js
simpleRouter.resolve('/')
// =>
```

```js
simpleRouter.resolve('/posts/123')
// =>
```

```js
simpleRouter.resolve('/forum/post/123?page=2')
// =>
```

```js
simpleRouter.resolve('/oops')
// =>
```


### RouteMapper#generate(routeObject)

Generates a path String based on the given Route Object. This is the reverse of `resolve`.

- `routeObject` A Route Object as described above.
- __Returns__ a String representing the path that will resolve to this route.
- __Throws__ an Error if the Route Object is not valid, or if the route `options` did not contain all the required placeholders defined in the route definition.

```js
simpleRouter.generate({ name: 'home', options: { } })
// =>
```

```js
simpleRouter.generate({ name: 'home', options: { page: '2' } })
// =>
```

```js
simpleRouter.generate({ name: 'post', options: { postId: '123' } })
// =>
```


### RouteMapper#getRouteDefinitionByName(name)

Returns the Route Definition Object for a route named by the String `name`.

```js
simpleRouter.getRouteDefinitionByName('post')
// =>
```

As mentioned above, you can store extra keys in Route Definition Objects.
At Taskworld we add `render(options)` function to each Route Definition Object,
and have the React component call it. e.g.

```js
const appRouter = createRouteMapper([
  projects: {
    route: '/',
    aliases: [ '/projects' ],
    render: ({ }) => <ProjectListPage />
  },
  project: {
    route: '/project/:projectId',
    render ({ projectId }) => <ProjectPage projectId={projectId} />
  }
])

const Application = ({ path }) => {
  const route = appRouter.resolve(path)
  const content = (route
    ? simpleRouter.getRouteDefinitionByName(route.name).render(route.options)
    : <NotFound />
  )
  return <AppLayout route={route}>{content}</AppLayout>
}
```


### Redirects

To be written


### Formats

To be written
