import type { ButtonVariant, ControlSize } from '@debdaru07/schema';
import type { ComponentId } from './focus.tsx';

export type SnippetLang = 'React' | 'Web' | 'React Native' | 'Flutter';

const FLUTTER_SIZE: Record<ControlSize, string> = { sm: 'sm', md: 'md', lg: 'lg' };

/** Usage for the selected component, matching each SDK's real API. */
export function snippets(component: ComponentId, { size, variant }: { size: ControlSize; variant: ButtonVariant }): Record<SnippetLang, string> {
  switch (component) {
    case 'button':
      return {
        React: `import { Button } from '@debdaru07/react';\n\n<Button variant="${variant}" size="${size}">Save changes</Button>`,
        Web: `<!-- @debdaru07/web/components.css -->\n<button class="dts-button dts-button--${variant}${size === 'md' ? '' : ` dts-button--${size}`}">Save changes</button>\n\n/* Tuned values arrive as CSS variables, e.g. */\n/* --dts-button-${size}-height, --dts-button-${variant}-container */`,
        'React Native': `import { Button } from '@debdaru07/react-native';\n\n<Button title="Save changes" variant="${variant}" size="${size}" onPress={save} />`,
        Flutter: `DtButton(\n  label: 'Save changes',\n  kind: DtButtonKind.${variant},\n  size: DtButtonSize.${FLUTTER_SIZE[size]},\n  onPressed: save,\n)`,
      };
    case 'input':
      return {
        React: `import { TextField } from '@debdaru07/react';\n\n<TextField label="Email" hint="We never share it" />`,
        Web: `<label class="dts-field dts-field--outlined">\n  <span class="dts-field__label">Email</span>\n  <span class="dts-field__control"><input class="dts-field__input" /></span>\n</label>`,
        'React Native': `import { TextField } from '@debdaru07/react-native';\n\n<TextField label="Email" value={email} onChangeText={setEmail} />`,
        Flutter: `// Uses the theme's InputDecorationTheme\nTextField(decoration: InputDecoration(labelText: 'Email'))`,
      };
    case 'card':
      return {
        React: `import { Card } from '@debdaru07/react';\n\n<Card title="Vehicle check due" subtitle="3 vehicles">\n  Book a slot to stay compliant.\n</Card>`,
        Web: `<div class="dts-card">\n  <h3 class="dts-card__title">Vehicle check due</h3>\n  <p class="dts-card__body">Book a slot to stay compliant.</p>\n</div>`,
        'React Native': `import { Card } from '@debdaru07/react-native';\n\n<Card title="Vehicle check due">…</Card>`,
        Flutter: `// Uses the theme's CardTheme and DtTokens card padding\nCard(child: Padding(padding: EdgeInsets.all(context.dt.components.card.padding), child: …))`,
      };
    case 'chip':
      return {
        React: `import { Chip } from '@debdaru07/react';\n\n<Chip selected={on} onClick={toggle}>In transit</Chip>`,
        Web: `<button class="dts-chip" aria-pressed="true">In transit</button>`,
        'React Native': `import { Chip } from '@debdaru07/react-native';\n\n<Chip label="In transit" selected={on} onPress={toggle} />`,
        Flutter: `// Uses the theme's ChipTheme\nFilterChip(label: const Text('In transit'), selected: on, onSelected: toggle)`,
      };
    case 'badge':
      return {
        React: `import { Badge } from '@debdaru07/react';\n\n<Badge count={12} label="12 unread" />`,
        Web: `<span class="dts-badge" role="status" aria-label="12 unread">12</span>`,
        'React Native': `import { Badge } from '@debdaru07/react-native';\n\n<Badge count={12} />`,
        Flutter: `// Uses the theme's BadgeTheme\nBadge(label: const Text('12'), child: Icon(Icons.inbox))`,
      };
    case 'dialog':
      return {
        React: `import { ConfirmDialog } from '@debdaru07/react';\n\n<ConfirmDialog open={open} onClose={close} title="Cancel shipment?"\n  confirmLabel="Cancel shipment" onConfirm={cancel} />`,
        Web: `<div class="dts-dialog" role="dialog" aria-modal="true">\n  <h2 class="dts-dialog__title">Cancel shipment?</h2>\n  <div class="dts-dialog__actions">…</div>\n</div>`,
        'React Native': `import { Dialog } from '@debdaru07/react-native';\n\n<Dialog visible={open} onDismiss={close} title="Cancel shipment?" />`,
        Flutter: `// Uses the theme's DialogTheme\nshowDialog(context: context, builder: (_) => AlertDialog(title: const Text('Cancel shipment?')))`,
      };
  }
}
