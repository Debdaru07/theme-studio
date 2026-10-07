import { leafPaths, seedOf, type Theme } from '@dts/schema';
import { cssVarName, type CssVarPath } from '@dts/web';
import type { SdkId } from './sdks.ts';

/**
 * One row per token a developer can read, with its value in this client's resolved theme and the exact
 * expression for each SDK. Accessors mirror `sdks/*`: CSS variables from `@dts/web`'s naming,
 * `context.dt` fields in Flutter (where `2xl` is `xxl`), `useTheme()` / helpers in React and React Native.
 */
export type Category = 'Color' | 'Typography' | 'Spacing & layout' | 'Shape & elevation' | 'Motion' | 'Components' | 'Navigation';
export const CATEGORIES: Category[] = ['Color', 'Typography', 'Spacing & layout', 'Shape & elevation', 'Motion', 'Components', 'Navigation'];

export interface TokenRow {
  /** Schema path, e.g. `color.primary`, `spacing.scale.md`. */
  path: string;
  category: Category;
  /** Display value; colors carry light and dark. */
  value: string;
  dark?: string;
  /** Hex to show as a swatch (light, then dark). */
  swatch?: [string, string];
  access: Record<SdkId, string>;
  /** True when this client's own layer sets it (directly, or through its seed color). */
  set: boolean;
}

const v = (path: CssVarPath) => `var(${cssVarName(path)})`;
const dartKey = (k: string) => ({ '2xl': 'xxl', '3xl': 'xxxl' })[k] ?? k;
const jsKey = (k: string) => (/^\d/.test(k) ? `['${k}']` : `.${k}`);
const px = (n: number | null) => (n === null ? 'none' : `${n}px`);

/** Material TextTheme slot for each schema text style (sdks/flutter theme_builder.dart). */
const FLUTTER_TEXT: Record<string, string> = {
  display: 'displayMedium',
  headline: 'headlineMedium',
  caption: 'labelSmall',
};

export function buildRows(theme: Theme, layer: unknown): TokenRow[] {
  const own = new Set(leafPaths(layer ?? {}));
  const has = (...paths: string[]) => paths.some((p) => own.has(p) || [...own].some((o) => o.startsWith(`${p}.`)));
  const rows: TokenRow[] = [];
  const add = (row: Omit<TokenRow, 'set'> & { set?: boolean }) => rows.push({ set: has(row.path), ...row });

  // ── Color ──
  for (const role of Object.keys(theme.color.light) as (keyof Theme['color']['light'])[]) {
    const light = theme.color.light[role];
    const dark = theme.color.dark[role];
    add({
      path: `color.${role}`,
      category: 'Color',
      value: light.toUpperCase(),
      dark: dark.toUpperCase(),
      swatch: [light, dark],
      // A role is this client's when it overrides it, or sets the seed it is derived from.
      set: has(`color.light.${role}`, `color.dark.${role}`, `color.seed.${seedOf(role)}`),
      access: {
        web: v(`color.${role}`),
        react: `cssVar('color.${role}')`,
        'react-native': `colors.${role}`,
        flutter: `context.dt.colors.${role}`,
      },
    });
  }

  // ── Typography ──
  for (const [k, family] of Object.entries(theme.typography.fontFamily)) {
    add({
      path: `typography.fontFamily.${k}`,
      category: 'Typography',
      value: family,
      access: {
        web: v(`font.${k as 'primary'}`),
        react: `cssVar('font.${k}')`,
        'react-native': `theme.typography.fontFamily.${k}`,
        flutter: `context.dt.typography.fontFamily.${k}`,
      },
    });
  }
  for (const [name, s] of Object.entries(theme.typography.styles)) {
    const kebab = cssVarName(`text.${name}.size` as CssVarPath).replace(/-size$/, '');
    add({
      path: `typography.styles.${name}`,
      category: 'Typography',
      value: `${s.family} ${s.size}/${s.lineHeight} · ${s.weight}${s.italic ? ' italic' : ''}`,
      access: {
        web: `${kebab}-{family,size,weight,line-height}`,
        react: `cssVar('text.${name}.size')`,
        'react-native': `textStyle(theme, '${name}', breakpoint)`,
        flutter: `Theme.of(context).textTheme.${FLUTTER_TEXT[name] ?? name}`,
      },
    });
  }

  // ── Spacing & layout ──
  for (const [k, n] of Object.entries(theme.spacing.scale)) {
    add({
      path: `spacing.scale.${k}`,
      category: 'Spacing & layout',
      value: px(n),
      access: {
        web: v(`space.${k as 'md'}`),
        react: `cssVar('space.${k}')`,
        'react-native': `theme.spacing.scale${jsKey(k)}`,
        flutter: `context.dt.spacing.${dartKey(k)}`,
      },
    });
  }
  const layout = theme.spacing.layout;
  for (const k of ['pagePadding', 'sectionGap', 'cardGap', 'contentMaxWidth'] as const) {
    add({
      path: `spacing.layout.*.${k}`,
      category: 'Spacing & layout',
      value: (['mobile', 'tablet', 'desktop', 'wide'] as const).map((bp) => px(layout[bp][k])).join(' · '),
      set: has(...(['mobile', 'tablet', 'desktop', 'wide'] as const).map((bp) => `spacing.layout.${bp}.${k}`)),
      access: {
        web: v(k),
        react: `cssVar('${k}')`,
        'react-native': `theme.spacing.layout[breakpoint].${k}`,
        flutter: `context.dt.layout.${k}`,
      },
    });
  }
  for (const [k, n] of Object.entries(theme.spacing.component)) {
    const css = ({ cardPadding: 'card.padding', dialogPadding: 'dialog.padding' } as Record<string, CssVarPath>)[k] ?? (k as CssVarPath);
    add({
      path: `spacing.component.${k}`,
      category: 'Spacing & layout',
      value: px(n),
      access: {
        web: v(css),
        react: `cssVar('${css}')`,
        'react-native': `theme.spacing.component.${k}`,
        flutter: `context.dt.componentSpacing.${k}`,
      },
    });
  }

  // ── Shape & elevation ──
  for (const [k, n] of Object.entries(theme.shape.radius)) {
    add({
      path: `shape.radius.${k}`,
      category: 'Shape & elevation',
      value: px(n),
      access: {
        web: v(`radius.${k as 'md'}`),
        react: `cssVar('radius.${k}')`,
        'react-native': `radius(theme, '${k}')`,
        flutter: `context.dt.shape.radius.${k}`,
      },
    });
  }
  for (const [k, n] of Object.entries(theme.shape.borderWidth)) {
    add({
      path: `shape.borderWidth.${k}`,
      category: 'Shape & elevation',
      value: px(n),
      access: {
        web: v(`border.${k as 'thin'}`),
        react: `cssVar('border.${k}')`,
        'react-native': `theme.shape.borderWidth.${k}`,
        flutter: `context.dt.shape.borderWidth.${k}`,
      },
    });
  }
  Object.entries(theme.elevation.levels).forEach(([k, s], i) => {
    add({
      path: `elevation.levels.${k}`,
      category: 'Shape & elevation',
      value: s.opacity === 0 ? 'none' : `y ${s.offsetY} · blur ${s.blur} · ${Math.round(s.opacity * 100)}%`,
      access: {
        web: v(`shadow.${k as 'level1'}`),
        react: `cssVar('shadow.${k}')`,
        'react-native': `shadow(theme, ${i}, mode)`,
        flutter: `context.dt.shadow(${i})`,
      },
    });
  });

  // ── Motion ──
  for (const [k, ms] of Object.entries(theme.motion.duration)) {
    add({
      path: `motion.duration.${k}`,
      category: 'Motion',
      value: `${ms}ms`,
      access: {
        web: v(`duration.${k as 'short'}`),
        react: `useMotion().duration.${k}`,
        'react-native': `useMotion().duration.${k}`,
        flutter: `context.dt.motion.duration.${k}`,
      },
    });
  }
  for (const [k, c] of Object.entries(theme.motion.easing)) {
    add({
      path: `motion.easing.${k}`,
      category: 'Motion',
      value: `cubic-bezier(${c.join(', ')})`,
      access: {
        web: v(`easing.${k as 'standard'}`),
        react: `useMotion().easingCss.${k}`,
        'react-native': `easingFunction(theme, '${k}', Easing)`,
        flutter: `context.dt.motion.easing.${k}`,
      },
    });
  }
  add({
    path: 'motion.pageTransition',
    category: 'Motion',
    value: theme.motion.pageTransition,
    access: {
      web: '— (read theme.motion.pageTransition)',
      react: 'useMotion().pageTransition',
      'react-native': 'useMotion().pageTransition',
      flutter: 'applied by ThemeData',
    },
  });

  // ── Components ──
  const c = theme.components;
  const comp: Array<[string, string, CssVarPath | null, string]> = [
    ['button.variant', c.button.variant, null, 'components.button.variant'],
    ['button.radius', px(c.button.radius), 'button.radius', 'components.button.radius'],
    ['button.height', px(c.button.height), 'button.height', 'components.button.height'],
    ['button.paddingX', px(c.button.paddingX), 'button.paddingX', 'components.button.paddingX'],
    ['input.variant', c.input.variant, null, 'components.input.variant'],
    ['input.radius', px(c.input.radius), 'input.radius', 'components.input.radius'],
    ['input.height', px(c.input.height), 'input.height', 'components.input.height'],
    ['card.radius', px(c.card.radius), 'card.radius', 'components.card.radius'],
    ['card.elevation', `level${c.card.elevation}`, 'card.shadow', 'components.card.elevation'],
    ['dialog.radius', px(c.dialog.radius), 'dialog.radius', 'components.dialog.radius'],
    ['chip.radius', px(c.chip.radius), 'chip.radius', 'components.chip.radius'],
    ['badge.radius', px(c.badge.radius), 'badge.radius', 'components.badge.radius'],
  ];
  for (const [k, value, css, path] of comp) {
    add({
      path,
      category: 'Components',
      value,
      access: {
        web: css ? v(css) : `— (read theme.${path})`,
        react: css ? `cssVar('${css}')` : `useToken('${path}')`,
        'react-native': `theme.${path}`,
        flutter: `context.dt.${path}`,
      },
    });
  }

  // ── Navigation ──
  const nav = theme.navigation;
  add({
    path: 'navigation.pattern',
    category: 'Navigation',
    value: (['mobile', 'tablet', 'desktop', 'wide'] as const).map((bp) => nav.pattern[bp]).join(' · '),
    access: {
      web: 'theme.navigation.pattern[breakpoint]',
      react: 'useNavigationPattern()',
      'react-native': 'useNavigationPattern()',
      flutter: 'context.dt.navPattern',
    },
  });
  for (const k of ['showLabels', 'indicator'] as const) {
    add({
      path: `navigation.${k}`,
      category: 'Navigation',
      value: nav[k],
      access: {
        web: `theme.navigation.${k}`,
        react: `useToken('navigation.${k}')`,
        'react-native': `theme.navigation.${k}`,
        flutter: `context.dt.navigation.${k}`,
      },
    });
  }
  add({
    path: 'navigation.appBar.height',
    category: 'Navigation',
    value: px(nav.appBar.height),
    access: {
      web: v('appBar.height'),
      react: "cssVar('appBar.height')",
      'react-native': 'theme.navigation.appBar.height',
      flutter: 'context.dt.navigation.appBar.height',
    },
  });

  return rows;
}
