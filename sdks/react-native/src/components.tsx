import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Switch as RNSwitch, Text as RNText, TextInput, View } from 'react-native';
import type { ColorScheme, TextStyleName } from '@debdaru07/schema';
import { useTheme } from './ThemeProvider.tsx';
import { componentTokens } from '@debdaru07/web/core';
import { badgeStyle, buttonStyles, cardStyle, chipStyles, dialogStyles, inputStyles, shadow, textStyle } from './styles.ts';

/**
 * Themed UI components for React Native. Same names and props as @debdaru07/react, in RN terms
 * (`onPress`, `onChangeText`, `onValueChange`, `visible`). Every value comes from the theme via useTheme().
 */

export type Tone = 'success' | 'warning' | 'error' | 'info';
type ToneOrNeutral = Tone | 'neutral';

function useKit() {
  const ctx = useTheme();
  const { theme, colors, breakpoint } = ctx;
  return { ...ctx, s: theme.spacing.scale, c: componentTokens(theme), t: (name: TextStyleName) => textStyle(theme, name, breakpoint) };
}

function toneColors(colors: ColorScheme, tone: ToneOrNeutral) {
  if (tone === 'neutral') return { bg: colors.surfaceContainerHigh, fg: colors.onSurface, accent: colors.outline };
  const cap = tone.charAt(0).toUpperCase() + tone.slice(1);
  const k = colors as unknown as Record<string, string>;
  return { bg: k[`${tone}Container`]!, fg: k[`on${cap}Container`]!, accent: k[tone]! };
}

// ── Text ─────────────────────────────────────────────────────────────────────

export interface TextProps {
  variant?: TextStyleName;
  muted?: boolean;
  /** `header` for screen titles (announced as a heading). */
  role?: 'header';
  numberOfLines?: number;
  children?: ReactNode;
}

/** Text in one of the theme's 10 text styles and the current mode's on-surface color. */
export function Text({ variant = 'bodyMedium', muted, role, numberOfLines, children }: TextProps) {
  const { colors, t } = useKit();
  return (
    <RNText accessibilityRole={role} numberOfLines={numberOfLines} style={[t(variant), { color: muted ? colors.onSurfaceMuted : colors.onSurface }]}>
      {children}
    </RNText>
  );
}

// ── Actions ──────────────────────────────────────────────────────────────────

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  /** Defaults to the theme's `components.button.variant`. */
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** Full width. */
  block?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

/** Themed button: the theme's size (height, padding, text style) × variant (role colors, border, elevation) tuning. */
export function Button({ title, onPress, variant, size = 'md', icon, loading, disabled, block, accessibilityLabel, testID }: ButtonProps) {
  const { theme, mode } = useKit();
  const off = disabled || loading;
  const { container, label } = buttonStyles(theme, { variant, size, mode, disabled: off });
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: off, busy: loading }}
      testID={testID}
      hitSlop={Math.max(0, (theme.sizing.minTouchTarget - (container.minHeight ?? 0)) / 2)}
      style={({ pressed }: { pressed: boolean }) => ({
        ...container,
        opacity: pressed ? 1 - theme.effects.opacity.pressed : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: block ? 'stretch' : 'flex-start',
      })}
    >
      {loading ? <ActivityIndicator color={label.color} size="small" /> : icon}
      <RNText style={label}>{title}</RNText>
    </Pressable>
  );
}

export interface IconButtonProps {
  /** Accessible name; required because only an icon shows. */
  label: string;
  icon: ReactNode;
  onPress?: () => void;
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  disabled?: boolean;
}

/** Icon-only button sized to the theme's minimum touch target. */
export function IconButton({ label, icon, onPress, variant = 'standard', disabled }: IconButtonProps) {
  const { theme, colors } = useKit();
  const size = theme.sizing.minTouchTarget;
  const bg = { standard: 'transparent', filled: colors.primary, tonal: colors.secondaryContainer, outlined: 'transparent' }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }: { pressed: boolean }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderWidth: variant === 'outlined' ? theme.shape.borderWidth.thin : 0,
        borderColor: colors.outline,
        opacity: disabled ? theme.effects.opacity.disabled : pressed ? 1 - theme.effects.opacity.pressed : 1,
      })}
    >
      {icon}
    </Pressable>
  );
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface TextFieldProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  hint?: string;
  /** Error message; marks the field invalid and is read with it. */
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Defaults to the theme's `components.input.variant`. */
  variant?: 'outlined' | 'filled';
}

/** Labelled text input with hint and error, in the theme's input variant. */
export function TextField({ label, hint, error, multiline, prefix, suffix, variant, editable, ...input }: TextFieldProps) {
  const { theme, colors, mode, s, t } = useKit();
  const [focused, setFocused] = useState(false);
  const state = editable === false ? 'disabled' : error ? 'error' : focused ? 'focused' : 'default';
  const st = inputStyles(theme, { variant, mode, state });
  return (
    <View style={st.wrapper}>
      <RNText style={st.label}>{label}</RNText>
      <View
        style={{
          ...st.field,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: s.sm,
          minHeight: multiline ? (st.field.minHeight ?? 0) * 2 : st.field.minHeight,
        }}
      >
        {prefix}
        <TextInput
          {...input}
          editable={editable}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.onSurfaceMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[st.text, { flex: 1, paddingVertical: s.sm }]}
        />
        {suffix}
      </View>
      {error ? <RNText style={[t('caption'), { color: colors.error }]}>{error}</RNText> : null}
      {hint ? <RNText style={[t('caption'), { color: colors.onSurfaceMuted }]}>{hint}</RNText> : null}
    </View>
  );
}

export interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

/** Checkbox row with a theme-colored box; the whole row is the touch target. */
export function Checkbox({ label, value, onValueChange, disabled }: ToggleProps) {
  const { theme, colors, s, t } = useKit();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, minHeight: theme.sizing.minTouchTarget, opacity: disabled ? theme.effects.opacity.disabled : 1 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: theme.shape.radius.xs,
          borderWidth: theme.shape.borderWidth.thick,
          borderColor: value ? colors.primary : colors.outline,
          backgroundColor: value ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? <RNText style={{ color: colors.onPrimary, fontSize: 14, lineHeight: 16, fontWeight: '700' }}>✓</RNText> : null}
      </View>
      <RNText style={[t('bodyMedium'), { color: colors.onSurface }]}>{label}</RNText>
    </Pressable>
  );
}

/** Platform switch in the theme's colors, with a label. */
export function Switch({ label, value, onValueChange, disabled }: ToggleProps) {
  const { theme, colors, s, t } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s.md, minHeight: theme.sizing.minTouchTarget }}>
      <RNText style={[t('bodyMedium'), { color: colors.onSurface, flex: 1 }]}>{label}</RNText>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.outline}
        ios_backgroundColor={colors.surfaceContainerHigh}
      />
    </View>
  );
}

export interface ChipProps {
  label: string;
  /** Filter/choice chips: makes it a toggle. */
  selected?: boolean;
  onPress?: () => void;
  /** Input chips: shows a remove (×) button. */
  onRemove?: () => void;
  icon?: ReactNode;
}

/** Filter, choice or input chip in the theme's chip radius. */
export function Chip({ label, selected, onPress, onRemove, icon }: ChipProps) {
  const { theme, mode, s } = useKit();
  const { container, label: labelStyle } = chipStyles(theme, { selected, mode });
  const { paddingHorizontal, gap, ...box } = container;
  return (
    <View style={{ ...box, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        hitSlop={Math.max(0, (theme.sizing.minTouchTarget - (box.minHeight ?? 0)) / 2)}
        style={{ flexDirection: 'row', alignItems: 'center', gap, paddingHorizontal, minHeight: box.minHeight }}
      >
        {icon}
        <RNText style={labelStyle}>{label}</RNText>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${label}`} hitSlop={8} style={{ paddingRight: s.sm }}>
          <RNText style={{ color: labelStyle.color, fontSize: 16 }}>×</RNText>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Display ──────────────────────────────────────────────────────────────────

export interface StatusChipProps {
  label: string;
  tone?: ToneOrNeutral;
}

/** Read-only status. The word carries the meaning; color reinforces it. */
export function StatusChip({ label, tone = 'neutral' }: StatusChipProps) {
  const { colors, s, c, t } = useKit();
  const tc = toneColors(colors, tone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, height: 24, paddingHorizontal: s.sm, borderRadius: c.chip.radius, backgroundColor: tc.bg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.accent }} />
      <RNText style={[t('labelMedium'), { color: tc.fg }]}>{label}</RNText>
    </View>
  );
}

export interface BadgeProps {
  count?: number;
  max?: number;
  dot?: boolean;
  /** Spoken text, e.g. "3 unread messages". */
  label: string;
  /** Element the badge sits on. */
  children?: ReactNode;
}

/** Count or dot badge, standalone or anchored to `children`. */
export function Badge({ count, max = 99, dot, label, children }: BadgeProps) {
  const { theme, colors, mode } = useKit();
  const pill = badgeStyle(theme, mode);
  const badge = (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        ...pill,
        ...(dot ? { minWidth: 8, height: 8, paddingHorizontal: 0 } : null),
        alignItems: 'center',
        justifyContent: 'center',
        ...(children ? { position: 'absolute', top: -2, right: -2, borderWidth: 2, borderColor: colors.surface } : null),
      }}
    >
      {!dot && count !== undefined ? <RNText style={{ color: colors.onError, fontSize: 11, fontWeight: '600' }}>{count > max ? `${max}+` : count}</RNText> : null}
    </View>
  );
  if (!children) return badge;
  return (
    <View style={{ alignSelf: 'flex-start' }}>
      {children}
      {badge}
    </View>
  );
}

export interface CardProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  title?: string;
  subtitle?: string;
  /** Image or chart on top, edge to edge. */
  media?: ReactNode;
  actions?: ReactNode;
  /** Makes the whole card pressable (navigation). Don't combine with `actions`. */
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: ReactNode;
}

/** Surface for related content: elevated (theme shadow), outlined or filled. */
export function Card({ variant = 'elevated', title, subtitle, media, actions, onPress, accessibilityLabel, children }: CardProps) {
  const { theme, colors, mode, s, t } = useKit();
  const style = cardStyle(theme, mode, variant);
  const pad = style.padding ?? 0;
  const body = (
    <>
      {media ? <View style={{ marginTop: -pad, marginHorizontal: -pad, marginBottom: s.sm }}>{media}</View> : null}
      {title ? <RNText accessibilityRole="header" style={[t('titleMedium'), { color: colors.onSurface }]}>{title}</RNText> : null}
      {subtitle ? <RNText style={[t('bodySmall'), { color: colors.onSurfaceMuted }]}>{subtitle}</RNText> : null}
      {children}
      {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: s.sm, marginTop: s.sm }}>{actions}</View> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} style={style}>
        {body}
      </Pressable>
    );
  }
  return <View style={style}>{body}</View>;
}

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: ToneOrNeutral;
  variant?: CardProps['variant'];
}

/** A single metric with its label and change. */
export function StatCard({ label, value, delta, deltaTone = 'neutral', variant }: StatCardProps) {
  const { colors, t } = useKit();
  return (
    <Card variant={variant}>
      <RNText style={[t('labelMedium'), { color: colors.onSurfaceMuted }]}>{label}</RNText>
      <RNText style={[t('headline'), { color: colors.onSurface }]}>{value}</RNText>
      {delta ? <StatusChip label={delta} tone={deltaTone} /> : null}
    </Card>
  );
}

export interface ListItemProps {
  headline: string;
  supporting?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Hairline above the row (for rows after the first). */
  divider?: boolean;
}

/** One- or two-line row; pressable when `onPress` is set. */
export function ListItem({ headline, supporting, leading, trailing, onPress, divider }: ListItemProps) {
  const { theme, colors, s, t } = useKit();
  const content = (
    <>
      {leading}
      <View style={{ flex: 1 }}>
        <RNText numberOfLines={1} style={[t('bodyLarge'), { color: colors.onSurface }]}>
          {headline}
        </RNText>
        {supporting ? <RNText style={[t('bodyMedium'), { color: colors.onSurfaceMuted }]}>{supporting}</RNText> : null}
      </View>
      {trailing}
    </>
  );
  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: s.md,
    minHeight: 56,
    paddingVertical: s.sm,
    paddingHorizontal: s.lg,
    borderTopWidth: divider ? theme.shape.borderWidth.thin : 0,
    borderTopColor: colors.outlineMuted,
  };
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={supporting ? `${headline}, ${supporting}` : headline} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

export interface AvatarProps {
  name: string;
  uri?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Photo or initials in the theme's primary container color. */
export function Avatar({ name, uri, size = 'md' }: AvatarProps) {
  const { colors, t } = useKit();
  const px = { sm: 32, md: 40, lg: 56 }[size];
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return uri ? (
    <Image source={{ uri }} accessibilityLabel={name} style={{ width: px, height: px, borderRadius: px / 2 }} />
  ) : (
    <View accessibilityRole="image" accessibilityLabel={name} style={{ width: px, height: px, borderRadius: px / 2, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
      <RNText style={[t(size === 'lg' ? 'titleMedium' : 'labelLarge'), { color: colors.onPrimaryContainer }]}>{initials}</RNText>
    </View>
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Explains why a view is empty and what to do next. */
export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  const { colors, s, t } = useKit();
  return (
    <View style={{ alignItems: 'center', gap: s.sm, paddingVertical: s['2xl'], paddingHorizontal: s.lg }}>
      {icon ? (
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: s.sm }}>{icon}</View>
      ) : null}
      <RNText accessibilityRole="header" style={[t('titleLarge'), { color: colors.onSurface, textAlign: 'center' }]}>
        {title}
      </RNText>
      {description ? <RNText style={[t('bodyMedium'), { color: colors.onSurfaceMuted, textAlign: 'center' }]}>{description}</RNText> : null}
      {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: s.sm, marginTop: s.sm }}>{actions}</View> : null}
    </View>
  );
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export interface ProgressProps {
  /** 0–100. Omit for indeterminate (shows a spinner). */
  value?: number;
  label: string;
}

/** Linear progress bar; a themed spinner when indeterminate. */
export function Progress({ value, label }: ProgressProps) {
  const { colors } = useKit();
  if (value === undefined) return <ActivityIndicator color={colors.primary} accessibilityLabel={label} />;
  const v = Math.max(0, Math.min(100, value));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: v }} style={{ height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.secondaryContainer }}>
      <View style={{ width: `${v}%`, height: '100%', backgroundColor: colors.primary }} />
    </View>
  );
}

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: number | `${number}%`;
  height?: number;
  lines?: number;
}

/** Placeholder shape while content loads; hidden from screen readers. */
export function Skeleton({ variant = 'text', width, height, lines = 1 }: SkeletonProps) {
  const { theme, colors, c } = useKit();
  const lh = theme.typography.styles.bodyMedium.lineHeight;
  const one = (w: SkeletonProps['width'], key?: number) => (
    <View
      key={key}
      style={{
        width: variant === 'circle' ? (height ?? 40) : (w ?? '100%'),
        height: height ?? (variant === 'circle' ? 40 : variant === 'rect' ? 120 : lh),
        borderRadius: variant === 'circle' ? 999 : variant === 'rect' ? c.card.radius : theme.shape.radius.xs,
        backgroundColor: colors.surfaceContainerHigh,
      }}
    />
  );
  if (variant === 'text' && lines > 1) {
    return (
      <View importantForAccessibility="no-hide-descendants" style={{ gap: 8 }}>
        {Array.from({ length: lines }, (_, i) => one(i === lines - 1 ? '60%' : width, i))}
      </View>
    );
  }
  return <View importantForAccessibility="no-hide-descendants">{one(width)}</View>;
}

export interface AlertProps {
  tone?: Tone;
  title?: string;
  message?: string;
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

/** Inline message; errors and warnings are announced assertively. */
export function Alert({ tone = 'info', title, message, actions, onClose, closeLabel = 'Dismiss' }: AlertProps) {
  const { theme, colors, s, t } = useKit();
  const tc = toneColors(colors, tone);
  const urgent = tone === 'error' || tone === 'warning';
  return (
    <View
      accessibilityRole={urgent ? 'alert' : undefined}
      accessibilityLiveRegion={urgent ? 'assertive' : 'polite'}
      style={{ flexDirection: 'row', gap: s.md, padding: s.md, paddingLeft: s.lg, borderRadius: theme.shape.radius.md, borderLeftWidth: 4, borderLeftColor: tc.accent, backgroundColor: tc.bg }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <RNText style={[t('titleMedium'), { color: tc.fg }]}>{title}</RNText> : null}
        {message ? <RNText style={[t('bodyMedium'), { color: tc.fg }]}>{message}</RNText> : null}
        {actions ? <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>{actions}</View> : null}
      </View>
      {onClose ? (
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel} hitSlop={10}>
          <RNText style={{ color: tc.fg, fontSize: 18 }}>×</RNText>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface ToastProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  /** ms before auto-dismiss; 0 keeps it. Default 4000 (6000 with an action). */
  duration?: number;
}

/** Brief confirmation pinned to the bottom of its parent; announced politely. */
export function Toast({ visible, message, actionLabel, onAction, onClose, duration }: ToastProps) {
  const { theme, colors, mode, s, t } = useKit();
  const close = useRef(onClose);
  close.current = onClose;
  const ms = duration ?? (actionLabel ? 6000 : 4000);
  useEffect(() => {
    if (!visible || ms === 0) return;
    const id = setTimeout(() => close.current(), ms);
    return () => clearTimeout(id);
  }, [visible, ms]);
  if (!visible) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: s.lg,
        right: s.lg,
        bottom: s.xl,
        zIndex: theme.elevation.zIndex.toast,
        flexDirection: 'row',
        alignItems: 'center',
        gap: s.md,
        minHeight: 48,
        paddingLeft: s.lg,
        paddingRight: s.sm,
        borderRadius: theme.shape.radius.sm,
        backgroundColor: colors.onSurface,
        ...shadow(theme, 3, mode),
      }}
    >
      <RNText style={[t('bodyMedium'), { color: colors.surface, flex: 1 }]}>{message}</RNText>
      {actionLabel ? (
        <Pressable
          onPress={() => {
            onAction?.();
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={{ paddingHorizontal: s.md, minHeight: 36, justifyContent: 'center' }}
        >
          <RNText style={[t('labelLarge'), { color: colors.primaryContainer }]}>{actionLabel}</RNText>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Overlays ─────────────────────────────────────────────────────────────────

export interface DialogProps {
  visible: boolean;
  /** Android back button and scrim tap (when `dismissible`). */
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  dismissible?: boolean;
}

/** Modal dialog in the theme's dialog radius, padding and elevation. */
export function Dialog({ visible, onClose, title, description, icon, actions, children, dismissible = true }: DialogProps) {
  const { theme, colors, mode, t } = useKit();
  const st = dialogStyles(theme, mode);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => dismissible && onClose()}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.layout.mobile.pagePadding }}>
        <Pressable accessibilityLabel="Close dialog" disabled={!dismissible} onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim }} />
        <View
          accessibilityViewIsModal
          style={{ ...st.container, width: '100%', maxWidth: 440 }}
        >
          {icon ? <View style={{ alignSelf: 'center' }}>{icon}</View> : null}
          <RNText accessibilityRole="header" style={[t('headline'), { color: colors.onSurface }]}>
            {title}
          </RNText>
          {description ? <RNText style={[t('bodyMedium'), { color: colors.onSurfaceMuted }]}>{description}</RNText> : null}
          {children}
          {actions ? <View style={st.actions}>{actions}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
}

/** Two-button decision; the confirm button turns `danger` when `destructive`. */
export function ConfirmDialog({ visible, title, description, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel, destructive, loading }: ConfirmDialogProps) {
  return (
    <Dialog
      visible={visible}
      onClose={onCancel}
      title={title}
      description={description}
      actions={
        <>
          <Button title={cancelLabel} variant="text" onPress={onCancel} />
          <Button title={confirmLabel} variant={destructive ? 'danger' : 'filled'} onPress={onConfirm} loading={loading} />
        </>
      }
    />
  );
}

// ── Navigation ───────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Names the tab bar for screen readers. */
  label: string;
}

/** Tab bar with the theme's primary indicator; shows the selected tab's content. */
export function Tabs({ items, value, defaultValue, onChange, label }: TabsProps) {
  const { theme, colors, s, t } = useKit();
  const [inner, setInner] = useState(defaultValue ?? items.find((i) => !i.disabled)?.id);
  const active = value ?? inner;
  const current = items.find((i) => i.id === active);
  return (
    <View>
      <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', borderBottomWidth: theme.shape.borderWidth.thin, borderBottomColor: colors.outlineMuted }}>
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (value === undefined) setInner(item.id);
                onChange?.(item.id);
              }}
              disabled={item.disabled}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected, disabled: item.disabled }}
              style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s.lg, borderBottomWidth: 3, borderBottomColor: selected ? colors.primary : 'transparent' }}
            >
              <RNText style={[t('labelLarge'), { color: item.disabled ? colors.onSurfaceDisabled : selected ? colors.primary : colors.onSurfaceMuted }]}>{item.label}</RNText>
            </Pressable>
          );
        })}
      </View>
      {current ? <View style={{ paddingTop: s.lg }}>{current.content}</View> : null}
    </View>
  );
}
