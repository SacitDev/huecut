/**
 * The page's one Trusted Types policy, `worker-bootstrap`: a policy can be created only once and the
 * CSP allows no other, so the worker bootstrap and the service-worker registration share it.
 */

interface TrustedTypePolicyLike {
  createScriptURL(url: string): unknown;
}
interface TrustedTypesLike {
  createPolicy(name: string, rules: { createScriptURL: (url: string) => string }): TrustedTypePolicyLike;
}

/** The policy name the CSP allows (`trusted-types worker-bootstrap`). */
export const BOOTSTRAP_POLICY = 'worker-bootstrap';
let policy: TrustedTypePolicyLike | null | undefined;

const swUrl = (): string => new URL(`${import.meta.env.BASE_URL}sw.js`, location.origin).href;

/** The policy, or null where the browser has no Trusted Types (then a plain string is accepted). */
function bootstrapPolicy(): TrustedTypePolicyLike | null {
  if (policy === undefined) {
    const tt = (globalThis as { trustedTypes?: TrustedTypesLike }).trustedTypes;
    policy =
      tt?.createPolicy(BOOTSTRAP_POLICY, {
        // Only the blob URLs the bootstrap makes and this site's own service worker pass; anything else is a bug or an attack.
        createScriptURL: (url) => {
          if (!url.startsWith('blob:') && url !== swUrl()) throw new TypeError(`worker-bootstrap refuses ${url}`);
          return url;
        },
      }) ?? null;
  }
  return policy;
}

/** A script URL the CSP accepts, typed as the string the DOM's types ask for. */
export function trustedScriptUrl(url: string): string {
  const trusted = bootstrapPolicy();
  return (trusted ? trusted.createScriptURL(url) : url) as string;
}
