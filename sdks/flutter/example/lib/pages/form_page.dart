import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';

import 'common.dart';

class FormPage extends StatefulWidget {
  const FormPage({super.key});

  @override
  State<FormPage> createState() => _FormPageState();
}

class _FormPageState extends State<FormPage> {
  final _formKey = GlobalKey<FormState>();
  DtInputVariant? _variant; // null = theme default
  bool? _submitted;

  /// Re-derives the input theme for a forced variant, so both styles can be compared.
  ThemeData _themeFor(BuildContext context) {
    final variant = _variant;
    final base = Theme.of(context);
    if (variant == null) return base;
    final theme = DynamicTheme.of(context).theme;
    final input = theme.components.input;
    final forced = theme.copyWith(
      components: DtComponents(
        button: theme.components.button,
        input: DtInputTokens(variant: variant, radius: input.radius, height: input.height),
        card: theme.components.card,
        dialog: theme.components.dialog,
        chip: theme.components.chip,
        badge: theme.components.badge,
      ),
    );
    return base.copyWith(inputDecorationTheme: DtThemeBuilder(forced).build(base.brightness).inputDecorationTheme);
  }

  void _submit() => setState(() => _submitted = _formKey.currentState!.validate());

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final gap = SizedBox(height: dt.componentSpacing.formGap);

    return PageList(children: [
      Section(
        title: 'Input style',
        child: Align(
          alignment: AlignmentDirectional.centerStart,
          child: SegmentedButton<DtInputVariant?>(
            segments: [
              ButtonSegment(value: null, label: Text('Theme (${dt.components.input.variant.name})')),
              const ButtonSegment(value: DtInputVariant.filled, label: Text('Filled')),
              const ButtonSegment(value: DtInputVariant.outlined, label: Text('Outlined')),
            ],
            selected: {_variant},
            onSelectionChanged: (s) => setState(() => _variant = s.first),
          ),
        ),
      ),
      Section(
        title: 'New delivery',
        child: Theme(
          data: _themeFor(context),
          child: Form(
            key: _formKey,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Customer name', helperText: 'As shown on the invoice'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Customer name is required' : null,
              ),
              gap,
              TextFormField(
                decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline)),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v))
                    ? 'Enter a valid email address'
                    : null,
              ),
              gap,
              TextFormField(
                decoration: const InputDecoration(labelText: 'Parcels', hintText: '1–50'),
                keyboardType: TextInputType.number,
                validator: (v) {
                  final n = int.tryParse(v ?? '');
                  return (n == null || n < 1 || n > 50) ? 'Between 1 and 50' : null;
                },
              ),
              gap,
              const TextField(
                enabled: false,
                decoration: InputDecoration(labelText: 'Depot (disabled)', hintText: 'Auckland Central'),
              ),
              gap,
              Wrap(spacing: dt.spacing.sm, runSpacing: dt.spacing.sm, children: [
                DtButton(label: 'Create delivery', onPressed: _submit),
                TextButton(
                  onPressed: () {
                    _formKey.currentState!.reset();
                    setState(() => _submitted = null);
                  },
                  child: const Text('Reset'),
                ),
              ]),
            ]),
          ),
        ),
      ),
      if (_submitted != null)
        _Banner(
          success: _submitted!,
          text: _submitted! ? 'Delivery created.' : 'Please fix the highlighted fields.',
        ),
    ]);
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.success, required this.text});

  final bool success;
  final String text;

  @override
  Widget build(BuildContext context) {
    final dt = context.dt;
    final c = dt.colors;
    return Container(
      padding: EdgeInsets.all(dt.spacing.lg),
      decoration: BoxDecoration(
        color: success ? c.successContainer : c.errorContainer,
        borderRadius: BorderRadius.circular(dt.shape.radius.sm),
      ),
      child: Row(children: [
        Icon(success ? Icons.check_circle : Icons.error_outline,
            color: success ? c.onSuccessContainer : c.onErrorContainer),
        SizedBox(width: dt.spacing.md),
        Expanded(
          child: Text(text, style: TextStyle(color: success ? c.onSuccessContainer : c.onErrorContainer)),
        ),
      ]),
    );
  }
}
