import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GROUP_TITLE_PREFIX } from './conversations';
import { SILENT_MARKER, groupInstructions } from './group';
import {
  LocaleProvider,
  getLocale,
  isLocale,
  localize,
  setLocale,
  subscribeLocale,
  t,
  useLocale,
} from './i18n';
import { REACTION_PROMPT } from './reactions';
import { zh } from './zh';

const EXTRA = [
  'Circle',
  'Pebble',
  'Teal',
  'Allow once',
  'Auto',
  'Copy message',
  'Untitled conversation',
  'Welcome',
  'Jan',
  'this Mac',
  'the host',
  'on {host}',
  'the terminal',
  'files',
  'No API key configured',
  'The key was refused by {label}. The Hermes home {where} holds another one — read the key again.',
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'vendor') continue;
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

function literalKeys(): string[] {
  const keys = new Set<string>();
  const pattern = /\bt\(\s*(['"])((?:\\.|(?!\1)[\s\S])*)\1/g;
  for (const file of sourceFiles(path.resolve('src'))) {
    if (file.endsWith(`${path.sep}zh.ts`) || file.endsWith(`${path.sep}i18n.tsx`)) {
      continue;
    }
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) keys.add(match[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n'));
  }
  return [...keys];
}

describe('the language of the window', () => {
  it('opens in Simplified Chinese, and can be asked to speak English', () => {
    setLocale('zh-CN');
    expect(getLocale()).toBe('zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(t('Settings')).toBe('设置');
    setLocale('en');
    expect(t('Settings')).toBe('Settings');
    expect(isLocale('zh-CN')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('ignores a language it does not have, and a repeat of the current one', () => {
    setLocale('en');
    const seen: string[] = [];
    const stop = subscribeLocale(() => seen.push(getLocale()));
    setLocale('en');
    setLocale('nope' as 'en');
    expect(seen).toEqual([]);
    expect(getLocale()).toBe('en');
    stop();
    setLocale('zh-CN');
    expect(seen).toEqual([]);
  });

  it('keeps a placeholder it was not given, and fills the ones it was', () => {
    setLocale('en');
    expect(t('Back to {name}', { name: 'Nova' })).toBe('Back to Nova');
    expect(t('Back to {name}')).toBe('Back to {name}');
    setLocale('zh-CN');
    expect(t('Back to {name}', { name: 'Nova' })).toBe('返回Nova');
    expect(t('Not a sentence the app wrote')).toBe('Not a sentence the app wrote');
  });

  it('translates a shell sentence, and leaves a host name where it was', () => {
    setLocale('zh-CN');
    expect(localize('')).toBe('');
    expect(localize('No API key configured')).toBe('还没有 API 密钥');
    expect(
      localize(
        'The key was refused by jetson. The Hermes home on jetson holds another one — read the key again.',
      ),
    ).toContain('jetson');
    expect(
      localize(
        'The key was refused by this Mac. Read the key from this Mac again in Settings → Connection.',
      ),
    ).toContain('这台 Mac');
    expect(
      localize(
        'The key in the Hermes home on this Mac was refused too. Check API_SERVER_KEY in ~/.hermes/.env.',
      ),
    ).toContain('API_SERVER_KEY');
    expect(localize('a traceback the app does not know')).toBe(
      'a traceback the app does not know',
    );
    setLocale('en');
    expect(localize('No API key configured')).toBe('No API key configured');
  });

  it('redraws when the language changes', () => {
    setLocale('en');
    function Probe() {
      useLocale();
      return <span>{t('Language')}</span>;
    }
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByText('Language')).toBeTruthy();
    act(() => setLocale('zh-CN'));
    expect(screen.getByText('语言')).toBeTruthy();
  });
});

describe('every sentence the window can say', () => {
  it('has Simplified Chinese, and the Chinese still names every placeholder', () => {
    const missing = literalKeys().filter((key) => zh[key] === undefined);
    expect(missing).toEqual([]);
    for (const key of EXTRA) expect(zh[key], key).toBeTypeOf('string');
    for (const [key, value] of Object.entries(zh)) {
      const names = key.match(/\{(\w+)\}/g) ?? [];
      for (const name of names) expect(value, key).toContain(name);
    }
  });
});

describe('what must stay in the language the harness reads', () => {
  it('keeps the group protocol, and the reaction marker', () => {
    expect(SILENT_MARKER).toBe('[[silent]]');
    expect(GROUP_TITLE_PREFIX).toBe('Group · ');
    const instructions = groupInstructions('Crew', [
      { id: 'bob', name: 'Bob', avatar: { color: '#fff', shape: 'cercle', variant: 'neutral' } },
    ]);
    expect(instructions).toContain('[[silent]]');
    expect(instructions).toContain('[[react:');
    expect(REACTION_PROMPT).toContain('[[react:');
  });
});
