import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { BotStyle, GroupMember, SingleAvatar } from '../data';
import { profileColor } from '../profileColor';
import type { BloubShape } from './bloubFrames';
import { AgentAvatar } from './AgentAvatar';
import { AnimatedBloub } from './AnimatedBloub';
import { BLOUB_COLOR_OPTIONS } from './Bloub';
import { ColorGrid, ShapeGrid } from './LogoControls';
import { localize, t } from '../i18n';

export type CreateCandidate = {
  id: string;
  name: string;
  /** Hermes profile the bot answers for; absent for the default bot. */
  profile?: string;
  avatar: SingleAvatar;
};

export type CreateBotOutcome = { ok: true } | { ok: false; error: string };

type CreateAgentDialogProps = {
  candidates: CreateCandidate[];
  onClose: () => void;
  onCreateBot: (
    input: {
      name: string;
      shape: BloubShape;
      color: string;
      /** Present only when the colour was picked by hand. */
      customColor?: string;
    },
  ) => Promise<CreateBotOutcome>;
  onCreateGroup: (input: { name: string; members: GroupMember[] }) => void;
};

export function toProfileId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

const DEFAULT_COLOR =
  BLOUB_COLOR_OPTIONS.find((color) => color.name === 'Indigo')?.hex ?? '#5b5bda';

export function CreateAgentDialog({
  candidates,
  onClose,
  onCreateBot,
  onCreateGroup,
}: CreateAgentDialogProps) {
  const [mode, setMode] = useState<'bot' | 'group'>('bot');
  const [name, setName] = useState('');
  const [shape, setShape] = useState<BloubShape>('cercle');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // The colour starts out as the one Hermes derives from the name, and follows
  // the name until the user picks one — then it is theirs.
  const [colorTouched, setColorTouched] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const selectedCandidates = candidates.filter((candidate) =>
    selected.includes(candidate.id),
  );
  const groupMembers: GroupMember[] = selectedCandidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    profile: candidate.profile,
    avatar: candidate.avatar,
  }));
  const groupStyles: BotStyle[] = groupMembers.map((member) => member.avatar);
  const profileId = mode === 'bot' ? toProfileId(name) : '';
  const canCreate =
    name.trim().length > 0 && (mode === 'bot' || selected.length >= 2);

  const hermesColor = useMemo(
    () => profileColor(profileId) ?? DEFAULT_COLOR,
    [profileId],
  );

  useEffect(() => {
    if (!colorTouched) setColor(hermesColor);
  }, [hermesColor, colorTouched]);

  const preview =
    mode === 'group'
      ? selectedCandidates.length >= 2
        ? { kind: 'group' as const, members: groupStyles }
        : selectedCandidates[0]?.avatar ?? {
            color: '#3d3d44',
            shape: 'cercle' as const,
          }
      : { color, shape, variant: 'neutral' as const };

  function toggleCandidate(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canCreate || busy) return;
    if (mode !== 'bot') {
      onCreateGroup({ name: name.trim(), members: groupMembers });
      return;
    }
    setBusy(true);
    setError('');
    // However this ends — success, refusal, or a call that throws — the button
    // has to come back. A creation that fails silently is worse than one that
    // fails loudly.
    try {
      const outcome = await onCreateBot({
        name: name.trim(),
        shape,
        color,
        customColor: colorTouched ? color : undefined,
      });
      if (!outcome.ok) setError(outcome.error);
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : t('Could not create the bot.'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
        onSubmit={handleSubmit}
      >
        <div className={`modal-body ${mode === 'group' ? 'is-group' : ''}`}>
          <div className="modal-head">
            <div>
              <h2 id="create-title">{t('New agent')}</h2>
              <p>{t('Create a bot, or bring a few together.')}</p>
            </div>
            <button
              type="button"
              className="modal-close"
              aria-label={t('Close')}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="mode-switch" role="tablist" aria-label={t('Agent type')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'bot'}
              className={mode === 'bot' ? 'is-active' : ''}
              onClick={() => setMode('bot')}
            >
              {t('Bot')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'group'}
              className={mode === 'group' ? 'is-active' : ''}
              onClick={() => setMode('group')}
            >
              {t('Group')}
            </button>
          </div>

          <div className="creation-preview">
            {mode === 'bot' ? (
              <AnimatedBloub color={color} shape={shape} size={64} />
            ) : (
              <AgentAvatar avatar={preview} size={64} showBadge={false} />
            )}
          </div>

          <label className="field">
            <span>{mode === 'bot' ? t('Bot name') : t('Group name')}</span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              maxLength={64}
              spellCheck={false}
              disabled={busy}
              placeholder={
                mode === 'bot' ? t('e.g. Research assistant') : t('e.g. Launch crew')
              }
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
            />
          </label>

          {mode === 'bot' ? (
            <p className="create-hint">
              {profileId
                ? t('Creates the Hermes profile “{profileId}” on the connected machine.', { profileId: profileId })
                : t('A bot lives as a Hermes profile on the connected machine.')}
            </p>
          ) : null}

          {error ? <p className="create-error">{localize(error)}</p> : null}

          {mode === 'bot' ? (
            <>
              <div className="create-section">
                <span className="create-label">{t('Shape')}</span>
                <ShapeGrid value={shape} color={color} onChange={setShape} />
              </div>
              <div className="create-section">
                <span className="create-label">{t('Color')}</span>
                <ColorGrid
                  value={color}
                  onChange={(next) => {
                    setColorTouched(true);
                    setColor(next);
                  }}
                />
                {colorTouched ? (
                  <p className="create-hint">
                    {t('This is the colour Hermes will show for')} {name.trim() || t('this bot')}.
                  </p>
                ) : (
                  <p className="create-hint">
                    {t('Hermes\' own colour for')} {profileId || t('this name')} {t('— pick one to override it.')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="create-section">
              <div className="create-label-row">
                <span className="create-label">{t('Bots')}</span>
                <span className="create-count">
                  {selected.length} {t('selected')}
                </span>
              </div>
              <div className="member-picker">
                {candidates.map((candidate) => {
                  const checked = selected.includes(candidate.id);
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      className={`member-option ${checked ? 'is-checked' : ''}`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <AgentAvatar
                        avatar={candidate.avatar}
                        size={28}
                        showBadge={false}
                      />
                      <span className="member-name">{candidate.name}</span>
                      <span className="member-check" aria-hidden="true">
                        {checked ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
                {candidates.length < 2 ? (
                  <p className="create-hint">
                    {t('Create at least two bots before building a group.')}
                  </p>
                ) : null}
              </div>
              <p className="create-hint">
                {t('Pick at least two bots. Every member decides on its own whether to answer or stay silent, and can @ another member to hand over the floor.')}
              </p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="button-ghost" onClick={onClose}>
            {busy ? t('Close') : t('Cancel')}
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={!canCreate || busy}
          >
            {busy
              ? t('Creating bot…')
              : mode === 'bot'
                ? t('Create bot')
                : t('Create group')}
          </button>
        </div>
      </form>
    </div>
  );
}
