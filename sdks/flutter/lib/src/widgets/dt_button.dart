import 'package:flutter/material.dart';

import '../material/tokens_extension.dart';
import '../models/components.dart';

/// The theme's primary button: picks Filled / Filled.tonal / Outlined from
/// `components.button.variant` and applies `textTransform` to [label].
///
/// [danger] renders a destructive filled button in the theme's error colors, [text] a low-emphasis
/// TextButton, and [loading] shows a spinner and blocks presses.
class DtButton extends StatelessWidget {
  const DtButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant,
    this.style,
    this.loading = false,
    this.danger = false,
    this.text = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;

  /// Overrides the theme's variant.
  final DtButtonVariant? variant;
  final ButtonStyle? style;

  /// Shows a progress indicator in place of the icon and disables the button.
  final bool loading;

  /// Destructive action (delete, cancel order) in `error` / `onError`.
  final bool danger;

  /// Low-emphasis text button (secondary actions in dialogs and cards).
  final bool text;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final tokens = dt.components.button;
    final label = Text(tokens.textTransform.apply(this.label));
    final onPressed = loading ? null : this.onPressed;
    // A loading button is disabled, so its spinner uses the theme's disabled foreground, the same color as the
    // label. Never Material's default (primary), which vanishes on a primary button.
    final icon = loading
        ? SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2, color: dt.colors.onSurfaceDisabled))
        : this.icon;
    final style = danger
        ? FilledButton.styleFrom(backgroundColor: dt.colors.error, foregroundColor: dt.colors.onError).merge(this.style)
        : this.style;

    final Widget button;
    if (text) {
      button = icon == null
          ? TextButton(onPressed: onPressed, style: style, child: label)
          : TextButton.icon(onPressed: onPressed, style: style, icon: icon, label: label);
    } else if (danger) {
      button = icon == null
          ? FilledButton(onPressed: onPressed, style: style, child: label)
          : FilledButton.icon(onPressed: onPressed, style: style, icon: icon, label: label);
    } else {
      button = switch (variant ?? tokens.variant) {
        DtButtonVariant.filled => icon == null
            ? FilledButton(onPressed: onPressed, style: style, child: label)
            : FilledButton.icon(onPressed: onPressed, style: style, icon: icon, label: label),
        DtButtonVariant.tonal => icon == null
            ? FilledButton.tonal(onPressed: onPressed, style: style, child: label)
            : FilledButton.tonalIcon(onPressed: onPressed, style: style, icon: icon, label: label),
        DtButtonVariant.outlined => icon == null
            ? OutlinedButton(onPressed: onPressed, style: style, child: label)
            : OutlinedButton.icon(onPressed: onPressed, style: style, icon: icon, label: label),
      };
    }
    return loading
        ? Semantics(label: '${this.label}, loading', button: true, enabled: false, excludeSemantics: true, child: button)
        : button;
  }
}
