/**
 * Hash-based router with event dispatching
 */

export type RouteHandler = (params?: Record<string, string>) => void;

interface Route {
  path: string;
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];
  private notFoundHandler?: RouteHandler;

  /**
   * Registers a route handler
   * @param path - Route path (e.g., '/', '/day', '/week')
   * @param handler - Function to execute when route matches
   */
  on(path: string, handler: RouteHandler): void {
    this.routes.push({ path, handler });
  }

  /**
   * Registers a fallback handler for unmatched routes
   * @param handler - Function to execute when no route matches
   */
  notFound(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }

  /**
   * Starts listening to hash changes
   */
  listen(): void {
    const resolveHandler = () => this.resolve();
    window.addEventListener('hashchange', resolveHandler);
    window.addEventListener('load', resolveHandler);
  }

  /**
   * Resolves current hash to a route handler
   */
  resolve(): void {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes.find((r) => r.path === hash);

    if (route) {
      route.handler();
      // Dispatch custom event for route changes
      window.dispatchEvent(
        new CustomEvent('routechange', {
          detail: { path: hash },
        })
      );
    } else if (this.notFoundHandler) {
      this.notFoundHandler();
    }
  }

  /**
   * Programmatically navigate to a route
   * @param path - Route path to navigate to
   */
  navigate(path: string): void {
    window.location.hash = path;
  }

  /**
   * Gets the current route path
   */
  getCurrentPath(): string {
    return window.location.hash.slice(1) || '/';
  }
}

// Singleton router instance
export const router = new Router();
