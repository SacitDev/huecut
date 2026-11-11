/**
 * In-app browsers: Instagram, Facebook, TikTok and similar are detected from the
 * user agent, and Home then shows the notice with a copy-link button.
 */
import { copyText } from '../platform/clipboard.ts';
import { isInAppBrowser } from '../platform/device.ts';
import { en } from '../strings/en.ts';
import { InAppNotice } from '../ui/components/InAppNotice.tsx';

/** The notice, or nothing outside an in-app browser. */
export function InAppBrowserNotice() {
  if (!isInAppBrowser(navigator.userAgent)) return null;
  const t = en.inAppBrowser;
  return (
    <InAppNotice
      message={t.message}
      copyLabel={t.copyLink}
      copiedLabel={t.linkCopied}
      copyFailedText={t.copyFailed}
      link={window.location.href}
      howToLabel={t.howToOpen}
      howToText={t.howToOpenSteps}
      onCopy={async () => (await copyText(window.location.href)) === 'copied'}
    />
  );
}
