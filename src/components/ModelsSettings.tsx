import { useEffect, useMemo, useState } from 'react';
import type { HermesModel, HermesProfile } from '../hermes';
import {
  defaultModelFor,
  withAllVisible,
  isFavorite,
  isHidden,
  modelId,
  profileKey,
  useModelPrefs,
  withDefault,
  withFavorite,
  withVisibility,
} from '../modelPrefs';
import { avatarColor } from '../profileColor';
import { SearchIcon, StarIcon } from './Icons';
import { localize, t } from '../i18n';

type ModelsSettingsProps = {
  /** Only a live tunnel can list models and profiles. */
  connected: boolean;
};

type Bot = {
  key: string;
  label: string;
  profile?: string;
  /** Colour Hermes stores for this profile, when it has one. */
  color?: string;
};

export function ModelsSettings({ connected }: ModelsSettingsProps) {
  const bridge = window.hermes;
  const { prefs, update } = useModelPrefs();
  const [models, setModels] = useState<HermesModel[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [profiles, setProfiles] = useState<HermesProfile[] | null>(null);
  const [profilesError, setProfilesError] = useState('');
  const [profilesWarning, setProfilesWarning] = useState('');
  const [needle, setNeedle] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!bridge?.models) return;
    let cancelled = false;
    setModelsLoading(true);
    setModelsError('');
    bridge
      .models({})
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setModelsError(result.error ?? t('Could not list the models'));
          return;
        }
        setModels(result.models ?? []);
      })
      .catch((reason: Error) => {
        if (!cancelled) setModelsError(reason.message);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bridge, reload]);

  // The gateway is the authority on which bots exist; the disk fallback marks
  // itself so the page can say why the list may be stale.
  useEffect(() => {
    if (!bridge?.profiles) return;
    let cancelled = false;
    setProfilesError('');
    setProfilesWarning('');
    bridge
      .profiles()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setProfilesError(result.error ?? t('Could not list the bots'));
          return;
        }
        setProfiles(result.profiles ?? []);
        if (result.source === 'disk' && result.warning) {
          setProfilesWarning(result.warning);
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) setProfilesError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, [bridge, reload]);

  // The primary bot is the row the app always has, and the host may list it
  // under its own name too: the two are one bot. A second row for it would
  // share the key, and a shared key is a row React shows twice or drops.
  const bots = useMemo<Bot[]>(() => {
    const primary = (profiles ?? []).find(
      (bot) => profileKey(bot.name) === 'default',
    );
    const rows: Bot[] = [
      {
        key: 'default',
        label: primary?.title?.trim() || 'Chief of Staff',
        profile: undefined,
        color: primary?.color,
      },
    ];
    const seen = new Set(rows.map((bot) => bot.key));
    for (const bot of profiles ?? []) {
      const key = profileKey(bot.name);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        key,
        label: bot.title || bot.name,
        profile: bot.name,
        color: bot.color,
      });
    }
    return rows;
  }, [profiles]);

  const offeredModels = useMemo(
    () => (models ?? []).filter((entry) => !isHidden(prefs, modelId(entry))),
    [models, prefs],
  );

  const modelGroups = useMemo(() => {
    const search = needle.trim().toLowerCase();
    const byProvider = new Map<string, HermesModel[]>();
    for (const entry of models ?? []) {
      if (search && !entry.model.toLowerCase().includes(search)) continue;
      const key = entry.providerName || entry.provider;
      const list = byProvider.get(key) ?? [];
      list.push(entry);
      byProvider.set(key, list);
    }
    // Gateway order: a row must not jump under the cursor when its star moves.
    return [...byProvider.entries()];
  }, [models, needle]);

  const totalModels = models?.length ?? 0;
  const hiddenModels = models
    ? models.filter((entry) => isHidden(prefs, modelId(entry))).length
    : 0;
  const offeredCount = totalModels - hiddenModels;
  const configuredBots = bots.filter((bot) =>
    defaultModelFor(prefs, bot.profile),
  ).length;
  const searching = needle.trim() !== '';

  return (
    <div className="settings-page">
      <header className="settings-page-head">
        <div>
          <h2>{t('Models')}</h2>
          <p>
            {t('One default per bot, and a picker that only lists the models you actually reach for.')}
          </p>
        </div>
        <div className="settings-page-side">
          <div className="models-stats">
            <span>
              <strong>{offeredCount}</strong> {t('offered')}
            </span>
            <span className="models-stats-dot" aria-hidden="true" />
            <span>
              <strong>{bots.length}</strong>{' '}
              {bots.length === 1 ? t('bot') : t('bots')}
            </span>
          </div>
          <button
            type="button"
            className={`settings-page-action ${modelsLoading ? 'is-busy' : ''}`}
            disabled={!bridge || modelsLoading}
            onClick={() => setReload((count) => count + 1)}
          >
            {modelsLoading ? t('Refreshing…') : t('Refresh')}
          </button>
        </div>
      </header>

      {bridge ? null : (
        <p className="settings-notice">
          {t('Model settings are only available inside the desktop app.')}
        </p>
      )}
      {bridge && !connected ? (
        <p className="settings-notice">
          {t('The tunnel is closed — open Connection and connect to refresh the list. Your choices are kept.')}
        </p>
      ) : null}

      <section className="settings-card">
        <header className="settings-card-head">
          <div>
            <h3>{t('Bot defaults')}</h3>
            <p>{t('New conversations start on these models.')}</p>
          </div>
          <span className="settings-card-meta">
            {profiles === null && !profilesError
              ? t('Reading the gateway…')
              : t('{configuredBots} of {length} set', { configuredBots: configuredBots, length: bots.length })}
          </span>
        </header>

        {profilesError ? (
          <p className="models-error">{localize(profilesError)}</p>
        ) : null}

        <div className="models-bots">
          {bots.map((bot) => {
            const current = defaultModelFor(prefs, bot.profile);
            // A default can point at a model the gateway no longer lists (the
            // provider was removed, or the list has not loaded yet): keep it
            // selectable so the row reads what is actually stored.
            const orphan =
              current &&
              !offeredModels.some(
                (entry) => modelId(entry) === modelId(current),
              )
                ? current
                : null;
            return (
              <div className="models-bot" key={bot.key}>
                <span
                  className="models-bot-dot"
                  style={{ background: avatarColor(bot.color, bot.profile) }}
                  aria-hidden="true"
                />
                <span className="models-bot-name">{bot.label}</span>
                {bot.profile ? null : (
                  <span className="models-tag">{t('default')}</span>
                )}
                <select
                  className="models-select"
                  aria-label={t('Default model for {label}', { label: bot.label })}
                  value={current ? modelId(current) : ''}
                  disabled={!models}
                  onChange={(event) => {
                    const picked = offeredModels.find(
                      (entry) => modelId(entry) === event.target.value,
                    );
                    update(
                      withDefault(
                        prefs,
                        bot.profile,
                        picked
                          ? { model: picked.model, provider: picked.provider }
                          : null,
                      ),
                    );
                  }}
                >
                  <option value="">{t('Bot\'s own model')}</option>
                  {orphan ? (
                    <option value={modelId(orphan)}>{orphan.model}</option>
                  ) : null}
                  {offeredModels.map((entry) => (
                    <option key={modelId(entry)} value={modelId(entry)}>
                      {entry.model}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {profilesWarning ? (
          <p className="models-caption">{localize(profilesWarning)}</p>
        ) : null}
      </section>

      <section className="settings-card">
        <header className="settings-card-head">
          <div>
            <h3>{t('Picker')}</h3>
            <p>{t('Star what you use often, switch off the rest.')}</p>
          </div>
          <span className="settings-card-meta">
            {models
              ? t('{offeredCount} of {totalModels} on', { offeredCount: offeredCount, totalModels: totalModels })
              : modelsLoading
                ? t('Reading the gateway…')
                : '—'}
          </span>
        </header>

        <div className="models-toolbar">
          <label className="models-search">
            <SearchIcon size={14} />
            <input
              type="search"
              value={needle}
              placeholder={t('Search models')}
              spellCheck={false}
              onChange={(event) => setNeedle(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="models-show-all"
            disabled={prefs.hidden.length === 0}
            onClick={() => {
              update(withAllVisible(prefs));
            }}
          >
            {t('Show all')}
          </button>
        </div>

        {modelsError ? <p className="models-error">{localize(modelsError)}</p> : null}

        {!models && modelsLoading ? (
          <p className="models-empty">{t('Loading the model list…')}</p>
        ) : null}

        <div className="models-list">
          {modelGroups.map(([providerName, entries]) => {
            const on = entries.filter(
              (entry) => !isHidden(prefs, modelId(entry)),
            ).length;
            return (
              <section className="models-group" key={providerName}>
                <header className="models-group-head">
                  <span className="models-provider">{providerName}</span>
                  <span className="models-group-count">
                    {on}/{entries.length}
                  </span>
                </header>
                {entries.map((entry) => {
                  const id = modelId(entry);
                  const checked = !isHidden(prefs, id);
                  const favorite = isFavorite(prefs, id);
                  return (
                    <div
                      className={`models-row ${checked ? '' : 'is-off'}`}
                      key={id}
                    >
                      <button
                        type="button"
                        className={`models-star ${favorite ? 'is-on' : ''}`}
                        aria-pressed={favorite}
                        aria-label={
                          favorite
                            ? t('Remove {model} from favorites', { model: entry.model })
                            : t('Add {model} to favorites', { model: entry.model })
                        }
                        title={
                          favorite ? t('Remove from favorites') : t('Add to favorites')
                        }
                        onClick={() => update(withFavorite(prefs, id))}
                      >
                        <StarIcon filled={favorite} size={14} />
                      </button>
                      <span className="models-name">{entry.model}</span>
                      {entry.current ? (
                        <span className="models-tag">{t('in use')}</span>
                      ) : null}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        aria-label={t('List {model} in the picker', { model: entry.model })}
                        title={
                          checked
                            ? t('Listed in the model picker')
                            : t('Hidden from the model picker')
                        }
                        className={`settings-switch ${checked ? 'is-on' : ''}`}
                        onClick={() =>
                          update(withVisibility(prefs, id, !checked))
                        }
                      >
                        <span className="settings-switch-knob" />
                      </button>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>

        {models && modelGroups.length === 0 ? (
          <p className="models-empty">
            {searching
              ? t('No model matches that search.')
              : t('No authenticated provider offers a model yet.')}
          </p>
        ) : null}

        <p className="models-caption">
          {t('A model picked inside a conversation still wins over the bot default.')}
        </p>
      </section>
    </div>
  );
}
