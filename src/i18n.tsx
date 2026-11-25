import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { zh } from './zh';

/** The languages the desktop window can draw. */
export type Locale = 'zh-CN' | 'en';

export const DEFAULT_LOCALE: Locale = 'zh-CN';

export const LOCALES: readonly Locale[] = ['zh-CN', 'en'];

type Vars = Record<string, string | number>;

let current: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

export function isLocale(value: unknown): value is Locale {
  return value === 'zh-CN' || value === 'en';
}

export function getLocale(): Locale {
  return current;
}

/** Switches the window's language. Unknown values are ignored. */
export function setLocale(next: Locale): void {
  if (!isLocale(next) || next === current) return;
  current = next;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
  for (const listener of listeners) listener();
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
  );
}

/**
 * The sentence the person reads. English is the key, so the source stays
 * greppable. Placeholders are `{name}` and may move in the Chinese.
 */
export function t(message: string, vars?: Vars): string {
  const template = current === 'en' ? message : (zh[message] ?? message);
  return fill(template, vars);
}

/** A place named by the shell: "this Mac", "on jetson", or a host as typed. */
function localizePlace(token: string): string {
  if (zh[token]) return t(token);
  const on = /^on (.+)$/.exec(token);
  if (on) return t('on {host}', { host: on[1] });
  return token;
}

const SHELL_PATTERNS: Array<{
  pattern: RegExp;
  key: string;
  vars: (match: RegExpMatchArray) => Vars;
}> = [
  {
    pattern:
      /^The key was refused by (.+)\. The Hermes home (.+) holds another one — read the key again\.$/,
    key: 'The key was refused by {label}. The Hermes home {where} holds another one — read the key again.',
    vars: (match) => ({
      label: localizePlace(match[1]),
      where: localizePlace(match[2]),
    }),
  },
  {
    pattern:
      /^The key in the Hermes home (.+) was refused too\. Check API_SERVER_KEY in ~\/\.hermes\/\.env\.$/,
    key: 'The key in the Hermes home {where} was refused too. Check API_SERVER_KEY in ~/.hermes/.env.',
    vars: (match) => ({ where: localizePlace(match[1]) }),
  },
  {
    pattern:
      /^The key was refused by (.+)\. Read the key from \1 again in Settings → Connection\.$/,
    key: 'The key was refused by {label}. Read the key from {label} again in Settings → Connection.',
    vars: (match) => ({ label: localizePlace(match[1]) }),
  },
];

/**
 * A line the shell already wrote in English. Exact sentences are translated;
 * a host name inside a known sentence is kept; anything else is shown as the
 * shell wrote it.
 */
export function localize(text: string | null | undefined): string {
  if (!text) return '';
  if (current === 'en') return text;
  if (zh[text]) return zh[text];
  for (const rule of SHELL_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match) return t(rule.key, rule.vars(match));
  }
  return text;
}

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** The language the window is drawing. Reading it redraws when it changes. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/**
 * Re-renders the window when the language changes. The conversations stay
 * where they are; only the chrome is drawn again. A component that reads
 * `useLocale` is the one that hears the change; `App` does.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setTick] = useState(getLocale());
  useEffect(() => subscribeLocale(() => setTick(getLocale())), []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
