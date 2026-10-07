import 'package:flutter/material.dart';

import '../material/tokens_extension.dart';
import '../models/color.dart';
import 'dt_button.dart';

/// Themed UI components with the same names and props as the web, React and React Native SDKs.
///
/// Where Material 3 has the widget (TextField, Checkbox, Switch, chips, Badge, Card, ListTile, TabBar,
/// progress indicators, AlertDialog, SnackBar), these wrap it, so [DtThemeBuilder]'s ThemeData styles them.
/// The rest (status chip, stat card, alert, skeleton, empty state) read `context.dt` tokens directly.

/// Semantic tone for status chips, alerts and stat deltas.
enum DtTone { success, warning, error, info, neutral }

class _ToneColors {
  const _ToneColors(this.background, this.foreground, this.accent);
  final Color background;
  final Color foreground;
  final Color accent;
}

_ToneColors _tone(DtColorScheme c, DtTone tone) => switch (tone) {
      DtTone.success => _ToneColors(c.successContainer, c.onSuccessContainer, c.success),
      DtTone.warning => _ToneColors(c.warningContainer, c.onWarningContainer, c.warning),
      DtTone.error => _ToneColors(c.errorContainer, c.onErrorContainer, c.error),
      DtTone.info => _ToneColors(c.infoContainer, c.onInfoContainer, c.info),
      DtTone.neutral => _ToneColors(c.surfaceContainerHigh, c.onSurface, c.outline),
    };

// ── Actions ──────────────────────────────────────────────────────────────────

enum DtIconButtonVariant { standard, filled, tonal, outlined }

/// Icon-only button. [label] is required: it is the tooltip and the screen-reader name.
class DtIconButton extends StatelessWidget {
  const DtIconButton({super.key, required this.label, required this.icon, required this.onPressed, this.variant = DtIconButtonVariant.standard});

  final String label;
  final Widget icon;
  final VoidCallback? onPressed;
  final DtIconButtonVariant variant;

  @override
  Widget build(BuildContext context) => switch (variant) {
        DtIconButtonVariant.standard => IconButton(tooltip: label, onPressed: onPressed, icon: icon),
        DtIconButtonVariant.filled => IconButton.filled(tooltip: label, onPressed: onPressed, icon: icon),
        DtIconButtonVariant.tonal => IconButton.filledTonal(tooltip: label, onPressed: onPressed, icon: icon),
        DtIconButtonVariant.outlined => IconButton.outlined(tooltip: label, onPressed: onPressed, icon: icon),
      };
}

// ── Inputs ───────────────────────────────────────────────────────────────────

/// Text field with an always-visible label above it, hint and error text. The fill/outline comes from
/// the theme's `components.input.variant` via ThemeData.inputDecorationTheme.
class DtTextField extends StatelessWidget {
  const DtTextField({
    super.key,
    required this.label,
    this.controller,
    this.initialValue,
    this.onChanged,
    this.placeholder,
    this.hint,
    this.error,
    this.prefix,
    this.suffix,
    this.maxLines = 1,
    this.obscureText = false,
    this.keyboardType,
    this.enabled = true,
  });

  final String label;
  final TextEditingController? controller;
  final String? initialValue;
  final ValueChanged<String>? onChanged;
  final String? placeholder;
  final String? hint;
  final String? error;
  final Widget? prefix;
  final Widget? suffix;
  final int maxLines;
  final bool obscureText;
  final TextInputType? keyboardType;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      spacing: dt.components.input.labelGap,
      children: [
        Text(label, style: text.labelMedium?.copyWith(color: dt.colors.onSurface)),
        TextFormField(
          controller: controller,
          initialValue: controller == null ? initialValue : null,
          onChanged: onChanged,
          maxLines: maxLines,
          obscureText: obscureText,
          keyboardType: keyboardType,
          enabled: enabled,
          decoration: InputDecoration(
            hintText: placeholder,
            helperText: hint,
            errorText: error,
            prefixIcon: prefix,
            suffixIcon: suffix,
            // The visible label above is the field's name for screen readers too.
            semanticCounterText: label,
          ),
        ),
      ],
    );
  }
}

/// Checkbox row; the whole row is the touch target.
class DtCheckbox extends StatelessWidget {
  const DtCheckbox({super.key, required this.label, required this.value, required this.onChanged});

  final String label;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) => CheckboxListTile(
        title: Text(label),
        value: value,
        onChanged: onChanged == null ? null : (v) => onChanged!(v ?? false),
        controlAffinity: ListTileControlAffinity.leading,
        contentPadding: EdgeInsets.zero,
      );
}

/// Switch row with its label.
class DtSwitch extends StatelessWidget {
  const DtSwitch({super.key, required this.label, required this.value, required this.onChanged});

  final String label;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) =>
      SwitchListTile(title: Text(label), value: value, onChanged: onChanged, contentPadding: EdgeInsets.zero);
}

/// Filter/choice chip (with [selected] + [onSelected]) or input chip (with [onDeleted]).
class DtChip extends StatelessWidget {
  const DtChip({super.key, required this.label, this.selected = false, this.onSelected, this.onDeleted, this.icon});

  final String label;
  final bool selected;
  final ValueChanged<bool>? onSelected;
  final VoidCallback? onDeleted;
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    // ChipTheme (from DtThemeBuilder) sets padding and colors. Material never draws a chip shorter than 32 plus its
    // border, so a shorter `chip.height` is reached with a negative vertical density (Material allows down to -4).
    final dt = context.dt;
    final floor = 32 + 2 * dt.shape.borderWidth.thin;
    final shortfall = floor - dt.components.chip.height;
    final density = shortfall > 0 ? VisualDensity(vertical: (-shortfall / 2).clamp(VisualDensity.minimumDensity, 0)) : null;
    if (onDeleted != null) {
      return InputChip(
        label: Text(label),
        avatar: icon,
        onDeleted: onDeleted,
        deleteButtonTooltipMessage: 'Remove $label',
        visualDensity: density,
      );
    }
    return FilterChip(label: Text(label), avatar: icon, selected: selected, onSelected: onSelected, visualDensity: density);
  }
}

// ── Display ──────────────────────────────────────────────────────────────────

/// Read-only status label. The word carries the meaning; color only reinforces it.
class DtStatusChip extends StatelessWidget {
  const DtStatusChip({super.key, required this.label, this.tone = DtTone.neutral});

  final String label;
  final DtTone tone;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final t = _tone(dt.colors, tone);
    return Container(
      height: 24,
      padding: EdgeInsets.symmetric(horizontal: dt.spacing.sm),
      decoration: BoxDecoration(color: t.background, borderRadius: BorderRadius.circular(dt.components.chip.radius)),
      child: Row(mainAxisSize: MainAxisSize.min, spacing: 6, children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: t.accent, shape: BoxShape.circle)),
        Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: t.foreground)),
      ]),
    );
  }
}

/// Count or dot badge on [child]; [label] is what screen readers hear ("3 unread messages").
class DtBadge extends StatelessWidget {
  const DtBadge({super.key, required this.label, this.count, this.max = 99, this.dot = false, this.child});

  final String label;
  final int? count;
  final int max;
  final bool dot;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final c = dt.colors;
    final badge = dot || count == null
        ? Badge(backgroundColor: c.error, smallSize: 8, child: child)
        : Badge(
            backgroundColor: c.error,
            textColor: c.onError,
            padding: EdgeInsets.symmetric(horizontal: dt.components.badge.paddingX),
            label: Text(count! > max ? '$max+' : '$count'),
            child: child,
          );
    return Semantics(label: label, container: true, child: badge);
  }
}

enum DtCardVariant { elevated, outlined, filled }

/// Surface for related content. Elevated uses the theme's card elevation and radius (CardTheme).
class DtCard extends StatelessWidget {
  const DtCard({
    super.key,
    this.variant = DtCardVariant.elevated,
    this.title,
    this.subtitle,
    this.media,
    this.actions = const [],
    this.onTap,
    this.child,
  });

  final DtCardVariant variant;
  final String? title;
  final String? subtitle;
  final Widget? media;
  final List<Widget> actions;

  /// Makes the whole card tappable (navigation). Don't combine with [actions].
  final VoidCallback? onTap;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final text = Theme.of(context).textTheme;
    final card = dt.components.card;
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        ?media,
        Padding(
          padding: EdgeInsets.all(card.padding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            spacing: card.gap,
            children: [
              if (title != null) Semantics(header: true, child: Text(title!, style: text.titleMedium)),
              if (subtitle != null) Text(subtitle!, style: text.bodySmall?.copyWith(color: dt.colors.onSurfaceMuted)),
              ?child,
              if (actions.isNotEmpty)
                Align(alignment: Alignment.centerRight, child: Wrap(spacing: card.gap, runSpacing: card.gap, children: actions)),
            ],
          ),
        ),
      ],
    );
    final body = onTap == null ? content : InkWell(onTap: onTap, child: content);
    return switch (variant) {
      DtCardVariant.elevated => Card(clipBehavior: Clip.antiAlias, margin: EdgeInsets.zero, child: body),
      DtCardVariant.outlined => Card.outlined(clipBehavior: Clip.antiAlias, margin: EdgeInsets.zero, child: body),
      DtCardVariant.filled => Card.filled(clipBehavior: Clip.antiAlias, margin: EdgeInsets.zero, child: body),
    };
  }
}

/// A single metric with its label and change.
class DtStatCard extends StatelessWidget {
  const DtStatCard({super.key, required this.label, required this.value, this.delta, this.deltaTone = DtTone.neutral, this.variant = DtCardVariant.elevated});

  final String label;
  final String value;
  final String? delta;
  final DtTone deltaTone;
  final DtCardVariant variant;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final text = Theme.of(context).textTheme;
    return DtCard(
      variant: variant,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: dt.spacing.xs, children: [
        Text(label, style: text.labelMedium?.copyWith(color: dt.colors.onSurfaceMuted)),
        Text(value, style: text.headlineMedium?.copyWith(fontFeatures: const [FontFeature.tabularFigures()])),
        if (delta != null) DtStatusChip(label: delta!, tone: deltaTone),
      ]),
    );
  }
}

/// One- or two-line row (ListTile); tappable when [onTap] is set.
class DtListItem extends StatelessWidget {
  const DtListItem({super.key, required this.headline, this.supporting, this.leading, this.trailing, this.onTap});

  final String headline;
  final String? supporting;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => ListTile(
        title: Text(headline, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: supporting == null ? null : Text(supporting!),
        leading: leading,
        trailing: trailing,
        onTap: onTap,
      );
}

enum DtAvatarSize { sm, md, lg }

/// Photo or initials in the theme's primary container color; [name] is read by screen readers.
class DtAvatar extends StatelessWidget {
  const DtAvatar({super.key, required this.name, this.imageUrl, this.size = DtAvatarSize.md});

  final String name;
  final String? imageUrl;
  final DtAvatarSize size;

  String get _initials => name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).take(2).map((w) => w[0].toUpperCase()).join();

  @override
  Widget build(BuildContext context) {
    final c = context.dt.colors;
    final radius = switch (size) { DtAvatarSize.sm => 16.0, DtAvatarSize.md => 20.0, DtAvatarSize.lg => 28.0 };
    return Semantics(
      label: name,
      image: true,
      excludeSemantics: true,
      child: CircleAvatar(
        radius: radius,
        backgroundColor: c.primaryContainer,
        foregroundColor: c.onPrimaryContainer,
        foregroundImage: imageUrl == null ? null : NetworkImage(imageUrl!),
        child: Text(_initials),
      ),
    );
  }
}

/// Explains why a view is empty and what to do next.
class DtEmptyState extends StatelessWidget {
  const DtEmptyState({super.key, required this.title, this.description, this.icon, this.actions = const []});

  final String title;
  final String? description;
  final Widget? icon;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: dt.spacing.xxl, horizontal: dt.spacing.lg),
      child: Column(mainAxisSize: MainAxisSize.min, spacing: dt.spacing.sm, children: [
        if (icon != null)
          Container(
            width: 64,
            height: 64,
            margin: EdgeInsets.only(bottom: dt.spacing.sm),
            decoration: BoxDecoration(color: dt.colors.secondaryContainer, shape: BoxShape.circle),
            child: IconTheme(data: IconThemeData(color: dt.colors.onSecondaryContainer, size: 28), child: Center(child: icon)),
          ),
        Semantics(header: true, child: Text(title, style: text.titleLarge, textAlign: TextAlign.center)),
        if (description != null)
          Text(description!, style: text.bodyMedium?.copyWith(color: dt.colors.onSurfaceMuted), textAlign: TextAlign.center),
        if (actions.isNotEmpty) Wrap(alignment: WrapAlignment.center, spacing: dt.spacing.sm, children: actions),
      ]),
    );
  }
}

// ── Feedback ─────────────────────────────────────────────────────────────────

/// Linear progress: [value] 0–100, or null for indeterminate.
class DtProgress extends StatelessWidget {
  const DtProgress({super.key, required this.label, this.value});

  final String label;
  final double? value;

  @override
  Widget build(BuildContext context) => LinearProgressIndicator(
        value: value == null ? null : (value!.clamp(0, 100) / 100),
        color: context.dt.colors.primary,
        backgroundColor: context.dt.colors.secondaryContainer,
        semanticsLabel: label,
        semanticsValue: value == null ? null : '${value!.round()}%',
        borderRadius: BorderRadius.circular(2),
      );
}

enum DtSkeletonVariant { text, circle, rect }

/// Placeholder shape while content loads; excluded from semantics (announce loading elsewhere).
class DtSkeleton extends StatelessWidget {
  const DtSkeleton({super.key, this.variant = DtSkeletonVariant.text, this.width, this.height, this.lines = 1});

  final DtSkeletonVariant variant;
  final double? width;
  final double? height;
  final int lines;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final lineHeight = dt.typography.styles.bodyMedium.lineHeight;
    Widget block({double? w}) => Container(
          width: variant == DtSkeletonVariant.circle ? (height ?? 40) : w,
          height: height ?? switch (variant) { DtSkeletonVariant.circle => 40.0, DtSkeletonVariant.rect => 120.0, DtSkeletonVariant.text => lineHeight },
          decoration: BoxDecoration(
            color: dt.colors.surfaceContainerHigh,
            borderRadius: variant == DtSkeletonVariant.circle
                ? null
                : BorderRadius.circular(variant == DtSkeletonVariant.rect ? dt.components.card.radius : dt.shape.radius.xs),
            shape: variant == DtSkeletonVariant.circle ? BoxShape.circle : BoxShape.rectangle,
          ),
        );
    return ExcludeSemantics(
      child: variant == DtSkeletonVariant.text && lines > 1
          ? Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 8, children: [
              for (var i = 0; i < lines; i++)
                i == lines - 1 ? FractionallySizedBox(widthFactor: 0.6, child: block()) : block(w: width),
            ])
          : block(w: width),
    );
  }
}

/// Inline message with a tone accent. Errors and warnings are announced as live regions.
class DtAlert extends StatelessWidget {
  const DtAlert({super.key, this.tone = DtTone.info, this.title, this.message, this.actions = const [], this.onClose, this.closeLabel = 'Dismiss'});

  final DtTone tone;
  final String? title;
  final String? message;
  final List<Widget> actions;
  final VoidCallback? onClose;
  final String closeLabel;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final t = _tone(dt.colors, tone);
    final text = Theme.of(context).textTheme;
    final icon = switch (tone) {
      DtTone.success => Icons.check_circle_outline,
      DtTone.warning => Icons.warning_amber_outlined,
      DtTone.error => Icons.error_outline,
      _ => Icons.info_outline,
    };
    return Semantics(
      liveRegion: tone == DtTone.error || tone == DtTone.warning,
      container: true,
      child: Container(
        padding: EdgeInsets.fromLTRB(dt.spacing.lg, dt.spacing.md, dt.spacing.md, dt.spacing.md),
        decoration: BoxDecoration(
          color: t.background,
          borderRadius: BorderRadius.circular(dt.shape.radius.md),
          border: Border(left: BorderSide(color: t.accent, width: 4)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: dt.spacing.md, children: [
          Icon(icon, color: t.accent, size: dt.sizing.icon.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 2, children: [
              if (title != null) Text(title!, style: text.titleMedium?.copyWith(color: t.foreground)),
              if (message != null) Text(message!, style: text.bodyMedium?.copyWith(color: t.foreground)),
              if (actions.isNotEmpty) Padding(padding: EdgeInsets.only(top: dt.spacing.sm), child: Wrap(spacing: dt.spacing.sm, children: actions)),
            ]),
          ),
          if (onClose != null) IconButton(tooltip: closeLabel, onPressed: onClose, icon: Icon(Icons.close, color: t.foreground)),
        ]),
      ),
    );
  }
}

/// Shows a brief confirmation (a floating SnackBar styled by the theme). Needs a ScaffoldMessenger above.
ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showDtToast(
  BuildContext context,
  String message, {
  String? actionLabel,
  VoidCallback? onAction,
  Duration? duration,
}) {
  return ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(message),
    behavior: SnackBarBehavior.floating,
    duration: duration ?? Duration(seconds: actionLabel == null ? 4 : 6),
    action: actionLabel == null ? null : SnackBarAction(label: actionLabel, onPressed: onAction ?? () {}),
  ));
}

// ── Overlays ─────────────────────────────────────────────────────────────────

/// Dialog with the theme's dialog radius and elevation (AlertDialog); put the primary action last.
class DtDialog extends StatelessWidget {
  const DtDialog({super.key, required this.title, this.description, this.icon, this.actions = const [], this.child});

  final String title;
  final String? description;
  final Widget? icon;
  final List<Widget> actions;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final d = dt.components.dialog;
    final p = d.padding;
    final hasContent = description != null || child != null;
    // Material 3's layout with the theme's padding: icon → title 16, title → content 16 (Material's own gaps).
    return AlertDialog(
      icon: icon,
      iconPadding: icon == null ? null : EdgeInsets.fromLTRB(p, p, p, 16),
      title: Text(title),
      titlePadding: EdgeInsets.fromLTRB(p, icon == null ? p : 0, p, hasContent ? 0 : 20),
      contentPadding: EdgeInsets.fromLTRB(p, 16, p, p),
      content: !hasContent
          ? null
          : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, spacing: dt.spacing.lg, children: [
              if (description != null) Text(description!),
              ?child,
            ]),
      actions: actions,
      actionsPadding: EdgeInsets.fromLTRB(p, 0, p, p),
      // AlertDialog spaces actions by half of buttonPadding's horizontal total (buttonPadding does nothing else).
      buttonPadding: EdgeInsets.symmetric(horizontal: d.actionGap),
      actionsOverflowButtonSpacing: d.actionGap,
    );
  }
}

/// Asks a yes/no question. Resolves `true` on confirm, `false` on cancel or dismiss.
Future<bool> showDtConfirmDialog(
  BuildContext context, {
  required String title,
  String? description,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
  bool destructive = false,
  bool dismissible = true,
}) async {
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: dismissible,
    builder: (context) => DtDialog(
      title: title,
      description: description,
      actions: [
        DtButton(label: cancelLabel, text: true, onPressed: () => Navigator.of(context).pop(false)),
        DtButton(label: confirmLabel, danger: destructive, onPressed: () => Navigator.of(context).pop(true)),
      ],
    ),
  );
  return result ?? false;
}

// ── Navigation ───────────────────────────────────────────────────────────────

class DtTabItem {
  const DtTabItem({required this.label, required this.content});

  final String label;
  final Widget content;
}

/// Tab bar (theme indicator and label styles) with the selected tab's content below.
class DtTabs extends StatefulWidget {
  const DtTabs({super.key, required this.items, this.initialIndex = 0, this.onChanged});

  final List<DtTabItem> items;
  final int initialIndex;
  final ValueChanged<int>? onChanged;

  @override
  State<DtTabs> createState() => _DtTabsState();
}

class _DtTabsState extends State<DtTabs> with SingleTickerProviderStateMixin {
  late final TabController _controller = TabController(length: widget.items.length, vsync: this, initialIndex: widget.initialIndex)
    ..addListener(() {
      if (!_controller.indexIsChanging) widget.onChanged?.call(_controller.index);
    });

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          TabBar(controller: _controller, tabs: [for (final item in widget.items) Tab(text: item.label)]),
          Padding(
            padding: EdgeInsets.only(top: context.dt.spacing.lg),
            child: AnimatedBuilder(animation: _controller, builder: (context, _) => widget.items[_controller.index].content),
          ),
        ],
      );
}
