/** Class-name joiner for CSS Modules, whose lookups can be undefined. */

/** Joins the class names that are set, in order. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter((name): name is string => typeof name === 'string' && name !== '').join(' ');
}
