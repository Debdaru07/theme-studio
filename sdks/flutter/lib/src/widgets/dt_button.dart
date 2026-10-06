import 'package:flutter/material.dart';

import '../material/tokens_extension.dart';
import '../models/components.dart';

/// The theme's primary button: picks Filled / Filled.tonal / Outlined from
/// `components.button.variant` and applies `textTransform` to [label].
class DtButton extends StatelessWidget {
  const DtButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant,
    this.style,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;

  /// Overrides the theme's variant.
  final DtButtonVariant? variant;
  final ButtonStyle? style;

  @override
  Widget build(BuildContext context) {
    final tokens = context.dt.components.button;
    final text = Text(tokens.textTransform.apply(label));
    final icon = this.icon;
    return switch (variant ?? tokens.variant) {
      DtButtonVariant.filled => icon == null
          ? FilledButton(onPressed: onPressed, style: style, child: text)
          : FilledButton.icon(onPressed: onPressed, style: style, icon: icon, label: text),
      DtButtonVariant.tonal => icon == null
          ? FilledButton.tonal(onPressed: onPressed, style: style, child: text)
          : FilledButton.tonalIcon(onPressed: onPressed, style: style, icon: icon, label: text),
      DtButtonVariant.outlined => icon == null
          ? OutlinedButton(onPressed: onPressed, style: style, child: text)
          : OutlinedButton.icon(onPressed: onPressed, style: style, icon: icon, label: text),
    };
  }
}
