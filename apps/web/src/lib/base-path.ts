export function withBasePath(path: string): string {
  if (path.startsWith("http") || path.startsWith("#")) {
    return path
  }

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "")
  if (!base) {
    return path
  }
  if (path === "/") {
    return `${base}/`
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
