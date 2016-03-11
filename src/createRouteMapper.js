
import isEqual from 'lodash.isequal'
import uniloc from 'uniloc'
import invariant from 'invariant'
import createUrlMapper from 'url-mapper/mapper'
import { inspect } from 'util'


function createRouteMapper (routeDefinitions) {
  const routePathMap = { }
  const routeObjectMap = { }
  const mapper = createUrlMapper(createRouteCompiler)
  const followRedirects = protectFromInfiniteRecursion(_followRedirects)
  const formatRoute = protectFromInfiniteRecursion(_formatRoute)
  Object.keys(routeDefinitions).forEach(routeName => {
    const routeDefinition = Object.freeze({
      ...routeDefinitions[routeName],
      name: routeName
    })
    routePathMap[routeDefinition.route] = routeDefinition
    routeObjectMap[routeDefinition.name] = routeDefinition
    const aliases = routeDefinition.aliases || [ ]
    aliases.forEach(alias => { routePathMap[alias] = routeDefinition })
  })
  return {
    // Looks up a route by path name.
    //
    // - `path` A String representing the pathname. e.g. `/projects/1`
    //
    // Returns an Object with these keys:
    //
    // - `name` A String representing the route name.
    // - `options` An Object containing the route parameters and other.
    //
    resolve (path) {
      const result = mapper.map(path, routePathMap)
      if (!result) return null
      return validateAndCoerceRoute({ name: result.match.name, options: result.values })
    },

    // Ensures that a route is valid, and also follows all the redirects.
    //
    route (routeObject) {
      return validateAndCoerceRoute(routeObject)
    },

    // Generates a path from the specified `name` and `options`.
    //
    // Returns a String.
    //
    generate (unvalidatedRouteObject) {
      const validatedRoute = validateAndCoerceRoute(unvalidatedRouteObject)
      const formattedRoute = formatRoute(validatedRoute)
      if (process.env.NODE_ENV !== 'production') {
        const resolvedRoute = validateAndCoerceRoute(formattedRoute)
        invariant(isEqual(validatedRoute, resolvedRoute),
          'The formatted route for ' + inspect(validatedRoute) +
          ', which is ' + inspect(formattedRoute) +
          ' did not resolve back to the same route. Instead, it resolved to ' + inspect(resolvedRoute)
        )
      }
      const template = routeObjectMap[formattedRoute.name].route
      return mapper.stringify(template, formattedRoute.options).replace(/\?.+/, a => a.replace(/%2f/ig, '/'))
    },

    // Returns the route definition object identified by `name`.
    //
    // Returns a route definition object.
    //
    getRouteDefinitionByName (name) {
      return routeObjectMap[name]
    }
  }

  function validateAndCoerceRoute (route) {
    invariant(typeof route.name === 'string', 'route.name must be a string')
    invariant(route.options, 'route.options must be present')
    invariant(typeof route.options === 'object', 'route.options must be an object')
    return followRedirects(route)
  }

  function _followRedirects (route) {
    const routeDefinition = routeObjectMap[route.name]
    invariant(routeDefinition, 'Unrecognized route: ' + route.name)
    if (typeof routeDefinition.redirect === 'function') {
      return followRedirects(routeDefinition.redirect(route.options))
    }
    return route
  }

  function _formatRoute (route) {
    const routeDefinition = routeObjectMap[route.name]
    invariant(routeDefinition, 'Unrecognized route: ' + route.name)
    if (typeof routeDefinition.format === 'function') {
      const formattedRoute = routeDefinition.format(route.options)
      if (!formattedRoute) return route
      if (!isEqual(route, formattedRoute)) return formatRoute(formattedRoute)
    }
    return route
  }
}

const protectFromInfiniteRecursion = (() => {
  const _stack = [ ]
  return f => function () {
    try {
      if (_stack.length > 10) {
        throw new Error('Recursive limit reached! Here’s the most recent stack: ' + inspect(_stack))
      }
      _stack.push(arguments[0])
      return f.apply(this, arguments)
    } finally {
      _stack.pop()
    }
  }
})()

// HACK: Using uniloc only to generate mapper for only a single route for now
//       until these are fixed:
//         - https://github.com/unicorn-standard/uniloc/issues/4
//         - https://github.com/unicorn-standard/uniloc/issues/5
//
function createRouteCompiler (path) {
  const router = uniloc({ route: 'GET ' + path })
  return {
    parse (url) {
      const result = router.lookup(url)
      if (!result || !result.name) return null
      return result.options || { }
    },
    stringify (values) {
      return router.generate('route', values)
    }
  }
}

export default createRouteMapper
