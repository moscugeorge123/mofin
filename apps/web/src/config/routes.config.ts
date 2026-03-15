/**
 * Route protection configuration
 * Define which routes require authentication and which are public only
 */

export const routeConfig = {
  /**
   * Routes that require authentication
   * Users will be redirected to /login if not authenticated
   */
  protectedRoutes: [
    "/",
    "/bank-accounts",
    "/bank-accounts/*",
    "/transactions",
    "/transactions/*",
    "/dashboard",
    "/dashboard/*",
  ],

  /**
   * Routes that are only accessible when NOT authenticated
   * Users will be redirected to / if already authenticated
   */
  publicOnlyRoutes: ["/login", "/register"],

  /**
   * Default redirect for unauthenticated users
   */
  loginRedirect: "/login",

  /**
   * Default redirect for authenticated users trying to access public-only routes
   */
  authenticatedRedirect: "/",
}

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return routeConfig.protectedRoutes.some((route) => {
    if (route.endsWith("/*")) {
      const baseRoute = route.slice(0, -2)
      return pathname.startsWith(baseRoute)
    }
    return pathname === route
  })
}

/**
 * Check if a route is public only (e.g., login, register)
 */
export function isPublicOnlyRoute(pathname: string): boolean {
  return routeConfig.publicOnlyRoutes.includes(pathname)
}
