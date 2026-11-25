'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LOCALES = new Set(['zh-CN', 'en']);

/**
 * The language of the window, kept with the app's own record.
 *
 * It is not a conversation and it is not a preference of a bot. The renderer
 * keeps nothing in localStorage; this file is the same kind of record as the
 * connection.
 *
 * @param {{ userData: () => string, fs?: { readFileSync: Function, writeFileSync: Function, mkdirSync: Function } }} options
 */
function createLocaleStore({ userData, fs: io = fs }) {
  function file() {
    return path.join(userData(), 'hermes-locale.json');
  }

  function read() {
    try {
      const data = JSON.parse(io.readFileSync(file(), 'utf8'));
      if (LOCALES.has(data?.locale)) return data.locale;
    } catch {
      // A missing file is the first launch: Simplified Chinese.
    }
    return 'zh-CN';
  }

  function write(locale) {
    const next = LOCALES.has(locale) ? locale : 'zh-CN';
    io.mkdirSync(path.dirname(file()), { recursive: true });
    io.writeFileSync(file(), JSON.stringify({ locale: next }, null, 2), {
      mode: 0o600,
    });
    return next;
  }

  return { read, write };
}

module.exports = { createLocaleStore };
