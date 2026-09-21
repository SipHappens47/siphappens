/** Routes anyone can open without a session. Everything else is the protected app shell. */
export const PUBLIC_ROUTE_PREFIXES = ['auth', 'legal'] as const;

export function isPublicRoute(segments: readonly string[]): boolean {
  const root = segments[0];
  if (!root || root === 'index') return true;
  return (PUBLIC_ROUTE_PREFIXES as readonly string[]).includes(root);
}
