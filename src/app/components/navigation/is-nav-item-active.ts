/**
 * is-nav-item-active.ts
 *
 * Single helper to determine whether a navigation item should be marked active / aria-current="page".
 *
 * Rules:
 * 1. An exact match (pathname === href) is always active.
 * 2. Section roots (e.g. "/", "/dashboard", "/admin", or any href that is a parent of other hrefs)
 *    require an exact match so that "Home" is not marked current on every dashboard sub-route.
 * 3. For non-root items, pathname must match as a subpath (pathname.startsWith(href + "/")).
 * 4. When allHrefs are provided, picks the longest matching href among matching candidates
 *    so nested routes only highlight the most specific nav item.
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  allHrefs: string[] = []
): boolean {
  if (!pathname || !href) {
    return false;
  }

  // Exact match is always active
  if (pathname === href) {
    return true;
  }

  // Section root items require an exact match
  const isSectionRoot =
    href === "/" ||
    href === "/dashboard" ||
    href === "/admin" ||
    allHrefs.some((h) => h !== href && h.startsWith(href + "/"));

  if (isSectionRoot) {
    return false;
  }

  // Subpath check
  if (!pathname.startsWith(href + "/")) {
    return false;
  }

  // Longest matching href wins
  if (allHrefs.length > 0) {
    const matching = allHrefs.filter(
      (h) => pathname === h || pathname.startsWith(h + "/")
    );
    if (matching.length > 0) {
      const longest = matching.reduce((best, curr) =>
        curr.length > best.length ? curr : best
      );
      return href === longest;
    }
  }

  return true;
}
