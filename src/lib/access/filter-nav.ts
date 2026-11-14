import type { Need } from "./permissions";

interface NavNode {
  href?: string;
  need?: Need;
  category?: string;
  children?: NavNode[];
}

/**
 * NAV LAYER — hide what the person can't open.
 *  • entries with an href are checked against the route rule table (same source as RouteGuard)
 *  • entries without an href use their explicit `need`
 *  • groups disappear when none of their children remain
 *  • a category heading is kept for the first remaining item of that category,
 *    even if the item that originally carried it was removed
 */
export function filterNav<T extends NavNode>(
  items: T[],
  canPath: (href: string) => boolean,
  canNeed: (need: Need | undefined) => boolean,
): T[] {
  const allowed = (n: NavNode) => (n.need !== undefined ? canNeed(n.need) : n.href ? canPath(n.href) : true);

  const keepChild = (c: any): any | null => {
    if (c.children) {
      const kids = c.children.map(keepChild).filter(Boolean);
      return kids.length ? { ...c, children: kids } : null;
    }
    return allowed(c) ? c : null;
  };

  const out: T[] = [];
  let category: string | undefined;
  let emitted: string | undefined;
  for (const item of items) {
    if (item.category) category = item.category;
    let kept: any = null;
    if (item.children) {
      const kids = item.children.map(keepChild).filter(Boolean);
      if (kids.length) kept = { ...item, children: kids };
    } else if (allowed(item)) {
      kept = item;
    }
    if (!kept) continue;
    kept = { ...kept, category: category !== emitted ? category : undefined };
    emitted = category;
    out.push(kept);
  }
  return out;
}
