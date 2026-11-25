import type { BloubShape } from './bloubFrames';
import { t } from '../i18n';
import {
  BLOUB_COLOR_OPTIONS,
  BLOUB_SHAPE_OPTIONS,
  BloubSvg,
} from './Bloub';

type ShapeGridProps = {
  value: BloubShape;
  color: string;
  onChange: (shape: BloubShape) => void;
};

export function ShapeGrid({ value, color, onChange }: ShapeGridProps) {
  return (
    <div className="shape-grid">
      {BLOUB_SHAPE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`shape-option ${value === option.id ? 'is-active' : ''}`}
          aria-label={t(option.label)}
          aria-pressed={value === option.id}
          title={t(option.label)}
          onClick={() => onChange(option.id)}
        >
          <span className="shape-option-art">
            <BloubSvg color={color} shape={option.id} />
          </span>
          <span className="shape-option-label">{t(option.label)}</span>
        </button>
      ))}
    </div>
  );
}

type ColorGridProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorGrid({ value, onChange }: ColorGridProps) {
  return (
    <div className="color-grid">
      {BLOUB_COLOR_OPTIONS.map((color) => (
        <button
          key={color.hex}
          type="button"
          className={`color-option ${value === color.hex ? 'is-active' : ''}`}
          style={{ background: color.hex }}
          aria-label={t(color.name)}
          aria-pressed={value === color.hex}
          title={t(color.name)}
          onClick={() => onChange(color.hex)}
        />
      ))}
    </div>
  );
}
