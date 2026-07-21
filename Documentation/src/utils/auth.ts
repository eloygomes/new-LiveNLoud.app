export const isProtectedPath = (pathname: string) =>
  pathname === '/interno' || pathname.startsWith('/interno/') || pathname === '/operacao' || pathname.startsWith('/operacao/');

export function hasValidBasicAuth(header: string | null, user: string | undefined, password: string | undefined): boolean {
  if (!header?.startsWith('Basic ') || !user || !password) return false;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    return decoded.slice(0, separator) === user && decoded.slice(separator + 1) === password;
  } catch {
    return false;
  }
}
