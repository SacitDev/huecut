/**
 * The Settings sheet: Language, each named in its own words; Theme as a System / Light /
 * Dark radio group (no sun/moon toggle); Motion as Follow my device / Reduce. A choice applies at once and is kept on this device.
 */
import { useState, useSyncExternalStore } from 'react';
import { en } from '../strings/en.ts';
import { languageCopy } from '../strings/en-language.ts';
import { chooseLanguage, LANGUAGE_NAMES, LANGUAGES, languageState, subscribeLanguage, type Language } from '../strings/locale.ts';
import { OptionGroup, OptionTile } from '../ui/components/OptionTile.tsx';
import { Sheet } from '../ui/components/Sheet.tsx';
import {
  MOTIONS,
  THEMES,
  readMotion,
  readTheme,
  saveMotion,
  saveTheme,
  type Motion,
  type Theme,
} from './preferences.ts';

/** English or Latviešu: the choice is kept even when Latvian cannot load, so a reload tries again. */
function LanguageChoice() {
  const { chosen } = useSyncExternalStore(subscribeLanguage, languageState);
  const choose = (language: Language) => {
    void chooseLanguage(language);
  };
  return (
    <OptionGroup legend={languageCopy.legend} twoPerRow>
      {LANGUAGES.map((value) => (
        <OptionTile key={value} name="language" value={value} label={LANGUAGE_NAMES[value]} checked={chosen === value} onChange={choose} />
      ))}
    </OptionGroup>
  );
}

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const t = en.settings;
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [motion, setMotion] = useState<Motion>(readMotion);
  const chooseTheme = (value: Theme) => {
    setTheme(value);
    saveTheme(value);
  };
  const chooseMotion = (value: Motion) => {
    setMotion(value);
    saveMotion(value);
  };
  return (
    <Sheet
      open={open}
      title={t.title}
      onClose={onClose}
      closeLabel={en.sheet.close}
      expandLabel={en.sheet.expand}
      collapseLabel={en.sheet.collapse}
      initialSnap="full"
    >
      <LanguageChoice />
      <OptionGroup legend={t.theme} twoPerRow>
        {THEMES.map((value) => (
          <OptionTile
            key={value}
            name="theme"
            value={value}
            label={t.themes[value]}
            checked={theme === value}
            onChange={chooseTheme}
          />
        ))}
      </OptionGroup>
      <OptionGroup legend={t.motion} hint={t.motionHint} twoPerRow>
        {MOTIONS.map((value) => (
          <OptionTile
            key={value}
            name="motion"
            value={value}
            label={t.motions[value]}
            checked={motion === value}
            onChange={chooseMotion}
          />
        ))}
      </OptionGroup>
    </Sheet>
  );
}
