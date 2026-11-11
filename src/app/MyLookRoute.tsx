/**
 * The `#/my-look/:step` route: loads My look (its screens and the one machine, made on first use in `compose.ts`) only
 * when it is first opened, so Home and Explore never carry it, and hands the machine's port to the feature. The machine
 * outlives the route, so leaving for Explore keeps the work. A failed start says so, with Try again.
 */
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import type { ConsultPort } from '../features/consult/useConsult.ts';
import { en } from '../strings/en.ts';
import { Button } from '../ui/components/Button.tsx';
import { Progress } from '../ui/components/Progress.tsx';
import { useHashLocation } from './router.ts';
import styles from './routes.module.css';

interface Loaded {
  readonly port: ConsultPort;
  readonly Route: ComponentType<{ readonly port: ConsultPort }>;
  readonly ExampleBar: ComponentType<{ readonly port: ConsultPort; readonly asked: boolean }>;
}

/** Kept once loaded: the route remounts on every step's URL, and must render the step at once, heading and all. */
let ready: Loaded | null = null;
const load = (): Promise<Loaded> =>
  Promise.all([import('./compose.ts').then((m) => m.consult()), import('../features/consult/ConsultRoute.tsx'), import('../features/saved/ExampleBar.tsx')]).then(
    ([handle, feature, example]) => (ready = { port: handle.port, Route: feature.ConsultRoute, ExampleBar: example.ExampleBar }),
  );

/** My look's port if it has started in this page, else null: Saved shows it but never starts it. */
export const startedPort = (): ConsultPort | null => ready?.port ?? null;

export function MyLookRoute() {
  const asked = useHashLocation().query.get('source') === 'example';
  const [loaded, setLoaded] = useState<Loaded | 'failed' | null>(() => ready);
  const start = useCallback(() => {
    if (ready) return undefined;
    let live = true;
    void load().then(
      (l) => {
        if (live) setLoaded(l);
      },
      () => {
        if (live) setLoaded('failed');
      },
    );
    return () => {
      live = false;
    };
  }, []);
  useEffect(start, [start]);
  if (loaded !== null && loaded !== 'failed') {
    return (
      <>
        <loaded.ExampleBar port={loaded.port} asked={asked} />
        <loaded.Route port={loaded.port} />
      </>
    );
  }
  return (
    <section className={styles.page}>
      <h1>{en.nav.myLook}</h1>
      {loaded === 'failed' ? <p className={styles.body}>{en.consult.notLoaded}</p> : <Progress label={en.consult.starting} value={null} />}
      {loaded === 'failed' && (
        <Button variant="secondary" onClick={() => { setLoaded(null); start(); }}>
          {en.consult.tools.tryAgain}
        </Button>
      )}
    </section>
  );
}
