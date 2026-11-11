/**
 * The layout shell: a top bar with the logo, Help and Settings in the same place on every screen at
 * every size (WCAG 3.2.6), and one navigation (Explore, My look, Saved) that CSS places as a bottom tab bar on
 * compact, a rail on medium in landscape, and in the top bar from expanded up.
 */
import type { ReactNode, RefObject } from 'react';
import { en } from '../strings/en.ts';
import { cx } from '../ui/cx.ts';
import { Icon, type IconName } from '../ui/icons.tsx';
import { Logo } from '../ui/Logo.tsx';
import { links, type Section } from './routes.tsx';
import styles from './Shell.module.css';

interface NavItem {
  section: Exclude<Section, 'help' | null>;
  href: string;
  icon: IconName;
  /** The key of its name in `en.nav`, read when shown, so the name follows the language. */
  label: 'explore' | 'myLook' | 'saved';
}

const NAV_ITEMS: readonly NavItem[] = [
  { section: 'explore', href: links.explore, icon: 'compass', label: 'explore' },
  { section: 'my-look', href: links.myLook, icon: 'userFocus', label: 'myLook' },
  { section: 'saved', href: links.saved, icon: 'heart', label: 'saved' },
];

interface ShellProps {
  section: Section;
  mainRef: RefObject<HTMLElement | null>;
  onOpenSettings: () => void;
  children: ReactNode;
}

export function Shell({ section, mainRef, onOpenSettings, children }: ShellProps) {
  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.skip}
        onClick={() => {
          mainRef.current?.focus();
        }}
      >
        {en.app.skipToContent}
      </button>
      <TopBar section={section} onOpenSettings={onOpenSettings} />
      <MainNav section={section} />
      <main ref={mainRef} id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}

function TopBar({ section, onOpenSettings }: { section: Section; onOpenSettings: () => void }) {
  return (
    <header className={styles.top}>
      <a href={links.home} className={styles.home} aria-label={en.app.homeLink}>
        <Logo />
      </a>
      <div className={styles.actions}>
        <a
          href={links.help}
          className={cx(styles.action, 'press')}
          aria-current={section === 'help' ? 'page' : undefined}
        >
          <Icon name="question" className={styles.actionIcon} />
          <span>{en.nav.help}</span>
        </a>
        <button type="button" className={cx(styles.action, 'press')} aria-haspopup="dialog" onClick={onOpenSettings}>
          <Icon name="gearSix" className={styles.actionIcon} />
          <span>{en.nav.settings}</span>
        </button>
      </div>
    </header>
  );
}

function MainNav({ section }: { section: Section }) {
  return (
    <nav className={styles.nav} aria-label={en.nav.label}>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => (
          <li key={item.section}>
            <a
              href={item.href}
              className={cx(styles.navItem, 'press')}
              aria-current={section === item.section ? 'page' : undefined}
            >
              <span className={styles.navIcon}>
                <Icon name={item.icon} />
              </span>
              <span>{en.nav[item.label]}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
