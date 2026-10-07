import { contrastRatio } from './contrast.ts';
import { BUTTON_VARIANTS, CONTROL_SIZES, type ColorRole, type SurfaceRole, type Theme } from './tokens.ts';

export interface ComponentIssue {
  path: string;
  message: string;
  /** Errors block publishing; warnings are shown in Theme Studio. */
  level: 'error' | 'warning';
  mode?: 'light' | 'dark';
}

export interface ComponentReport {
  publishable: boolean;
  issues: ComponentIssue[];
}

/** WCAG 2.5.8 (AA) minimum target size. */
export const MIN_TARGET = 24;
/** Below this, medium/large controls get a "small for touch" warning. */
export const COMFORTABLE_CONTROL = 36;
const GRID = 4;

/**
 * Guardrails for component tuning, run alongside the contrast check on every resolve:
 *  - control heights ≥ 24px (error) and medium/large ≥ 36px (warning)
 *  - padding, gaps and heights on the 4px grid (warning)
 *  - text on filled variants ≥ 4.5:1 against its container (error); text on transparent variants against the
 *    surface (warning — the real background depends on where the component sits)
 */
export function checkComponents(theme: Theme): ComponentReport {
  const issues: ComponentIssue[] = [];
  const c = theme.components;

  const height = (path: string, value: number, comfortable: boolean) => {
    if (value < MIN_TARGET) {
      issues.push({ path, level: 'error', message: `${value}px is below the ${MIN_TARGET}px minimum target size (WCAG 2.5.8)` });
    } else if (comfortable && value < COMFORTABLE_CONTROL) {
      issues.push({ path, level: 'warning', message: `${value}px is small for touch; ${COMFORTABLE_CONTROL}px or more is recommended` });
    }
  };
  const grid = (path: string, value: number) => {
    if (value % GRID !== 0) issues.push({ path, level: 'warning', message: `${value}px is off the ${GRID}px spacing grid` });
  };

  for (const size of CONTROL_SIZES) {
    const s = c.button.sizes[size];
    height(`components.button.sizes.${size}.height`, s.height, size !== 'sm');
    grid(`components.button.sizes.${size}.height`, s.height);
    grid(`components.button.sizes.${size}.paddingX`, s.paddingX);
  }
  height('components.input.height', c.input.height, true);
  height('components.chip.height', c.chip.height, false);
  for (const [path, value] of [
    ['components.button.iconGap', c.button.iconGap],
    ['components.input.height', c.input.height],
    ['components.input.paddingX', c.input.paddingX],
    ['components.input.labelGap', c.input.labelGap],
    ['components.card.padding', c.card.padding],
    ['components.card.gap', c.card.gap],
    ['components.dialog.padding', c.dialog.padding],
    ['components.dialog.actionGap', c.dialog.actionGap],
    ['components.chip.height', c.chip.height],
    ['components.chip.paddingX', c.chip.paddingX],
    ['components.chip.iconGap', c.chip.iconGap],
    ['components.badge.paddingX', c.badge.paddingX],
  ] as const) {
    grid(path, value);
  }

  for (const mode of ['light', 'dark'] as const) {
    const scheme = theme.color[mode];
    const pair = (path: string, fg: ColorRole, bg: SurfaceRole) => {
      const filled = bg !== 'transparent';
      const ratio = contrastRatio(scheme[fg], scheme[filled ? bg : 'surface']);
      if (ratio < 4.5) {
        issues.push({
          path,
          mode,
          level: filled ? 'error' : 'warning',
          message: `${fg} on ${filled ? bg : 'surface'} is ${ratio.toFixed(2)}:1 in ${mode} mode; text needs 4.5:1`,
        });
      }
    };
    for (const v of BUTTON_VARIANTS) {
      const style = c.button.variants[v];
      pair(`components.button.variants.${v}.content`, style.content, style.container);
    }
    pair('components.chip.selected.content', c.chip.selected.content, c.chip.selected.container);
  }

  return { publishable: !issues.some((i) => i.level === 'error'), issues };
}
