import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { isLocale, LocaleProvider, setLocale } from './i18n';
import { ModelPrefsProvider } from './modelPrefs';
import { installDemoBridge } from './demo';
import './styles.css';

// A window with a host that is not there: `VITE_DEMO=1 npm run dev`. It is
// installed before the app mounts, so every read lands on the same made-up
// host — and a build started without the flag never sees it.
if (import.meta.env.VITE_DEMO === '1') installDemoBridge();

// The saved language, before the first paint. Simplified Chinese when none
// was saved. The menu was already built from the same record.
const savedLocale = window.hermes?.getLocale?.();
if (isLocale(savedLocale)) setLocale(savedLocale);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The preferences are read from the server, with the primary profile. */}
    <ModelPrefsProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </ModelPrefsProvider>
  </StrictMode>,
);
