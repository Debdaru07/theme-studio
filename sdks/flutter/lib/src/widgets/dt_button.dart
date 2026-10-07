import 'package:flutter/material.dart';

import '../material/theme_builder.dart';
import '../material/tokens_extension.dart';
import '../models/components.dart';

/// The theme's button, built from `components.button`: picks Filled / Filled.tonal / Outlined from the theme's
/// default variant, applies `textTransform` to [label], and takes height, padding, label style, radius, border,
/// icon gap, colors and elevation from the size and variant tokens (see [DtThemeBuilder.buttonStyle]).
///
/// Variant precedence: [kind], then [text], then [danger], then [variant], then the theme's default.
/// [loading] shows a spinner and blocks presses. [style] overrides any token value (local props win).
class DtButton extends StatelessWidget {
  const DtButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant,
    this.kind,
    this.size = DtButtonSize.md,
    this.style,
    this.loading = false,
    this.danger = false,
    this.text = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;

  /// Overrides the theme's default variant (filled, tonal or outlined).
  final DtButtonVariant? variant;

  /// Any of the five tuned variants (`filled`, `tonal`, `outlined`, `text`, `danger`); wins over [variant],
  /// [text] and [danger].
  final DtButtonKind? kind;

  /// `sm`, `md` (default) or `lg` from `components.button.sizes`.
  final DtButtonSize size;
  final ButtonStyle? style;

  /// Shows a progress indicator in place of the icon and disables the button.
  final bool loading;

  /// Destructive action (delete, cancel order): the `danger` variant.
  final bool danger;

  /// Low-emphasis text button (secondary actions in dialogs and cards): the `text` variant.
  final bool text;

  /// The variant this button renders with.
  DtButtonKind _resolveKind(DtButtonTokens tokens) =>
      kind ??
      (text
          ? DtButtonKind.text
          : danger
              ? DtButtonKind.danger
              : (variant ?? tokens.variant).kind);

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final tokens = dt.components.button;
    final kind = _resolveKind(tokens);
    final tokenStyle = DtThemeBuilder.buttonStyle(dt.tokens, Theme.of(context).textTheme, kind: kind, size: size);
    final style = this.style?.merge(tokenStyle) ?? tokenStyle;
    final onPressed = loading ? null : this.onPressed;
    // A loading button is disabled, so its spinner uses the theme's disabled foreground, the same color as the
    // label. Never Material's default (primary), which vanishes on a primary button.
    final icon = loading
        ? SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2, color: dt.colors.onSurfaceDisabled))
        : this.icon;
    final labelText = Text(tokens.textTransform.apply(label));
    // Material's `.icon` constructors use a fixed gap; the theme's iconGap needs our own row.
    final child = icon == null
        ? labelText
        : Row(
            mainAxisSize: MainAxisSize.min,
            spacing: tokens.iconGap,
            children: [icon, Flexible(child: labelText)],
          );

    final Widget button = switch (kind) {
      DtButtonKind.filled || DtButtonKind.danger => FilledButton(onPressed: onPressed, style: style, child: child),
      DtButtonKind.tonal => FilledButton.tonal(onPressed: onPressed, style: style, child: child),
      DtButtonKind.outlined => OutlinedButton(onPressed: onPressed, style: style, child: child),
      DtButtonKind.text => TextButton(onPressed: onPressed, style: style, child: child),
    };
    return loading
        ? Semantics(label: '$label, loading', button: true, enabled: false, excludeSemantics: true, child: button)
        : button;
  }
}
