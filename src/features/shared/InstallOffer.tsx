/**
 * "Install Huecut": the button only while the browser offers it, the Share words on iPhone and iPad, and nothing once the app runs installed. It sits last
 * on Home and Help, because the browser's offer can come at any moment and must not move anything under a tap.
 */
import { useSyncExternalStore } from 'react';
import { install, isIosDevice, isOffered, runsInstalled, subscribeOffer } from '../../platform/install.ts';
import { helpCopy } from '../../strings/en-help.ts';
import { Button } from '../../ui/components/Button.tsx';

/** The offer, the words or nothing, as this browser allows. */
export function InstallOffer() {
  const offered = useSyncExternalStore(subscribeOffer, isOffered);
  if (runsInstalled()) return null;
  if (offered) return <Button variant="secondary" onClick={install}>{helpCopy.install.button}</Button>;
  return isIosDevice() ? <p>{helpCopy.install.ios}</p> : null;
}
