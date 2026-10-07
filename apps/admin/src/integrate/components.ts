import type { SdkId } from './sdks.ts';

/**
 * Component docs for the Integrate tab. Examples use only the real APIs in sdks/* (checked by
 * components.test.ts): @debdaru07/web classes, @debdaru07/react and @debdaru07/react-native exports, Flutter Dt* widgets.
 */

export interface Prop {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ComponentDoc {
  id: string;
  name: string;
  category: 'Actions' | 'Inputs' | 'Display' | 'Feedback' | 'Overlays' | 'Navigation';
  summary: string;
  /** Theme tokens the component reads, so developers know what a theme change affects. */
  tokens: string[];
  a11y: string[];
  /** Props of the React component (the Web markup mirrors them as classes and attributes). */
  props: Prop[];
  /** One-line API in React Native and Flutter terms. */
  native: string;
  flutter: string;
  code: Record<SdkId, string>;
}

export const COMPONENT_SETUP: Record<SdkId, { lang: string; file: string; code: string; note: string }> = {
  web: {
    lang: 'ts',
    file: 'src/main.ts',
    note: 'Import the stylesheet once. Components are plain HTML with dts-* classes; state lives in native and ARIA attributes.',
    code: `import '@debdaru07/web/components.css'; // after applyTheme() from the Connect step`,
  },
  react: {
    lang: 'tsx',
    file: 'src/main.tsx',
    note: 'Import the stylesheet once; components must render inside <ThemeProvider> to pick up theme defaults.',
    code: `import '@debdaru07/react/components.css';
import { Button, Card, TextField } from '@debdaru07/react';`,
  },
  'react-native': {
    lang: 'tsx',
    file: 'App.tsx',
    note: 'No stylesheet: components read the theme from <ThemeProvider> through useTheme().',
    code: `import { Button, Card, TextField } from '@debdaru07/react-native';
// React Native's own Text / Switch also exist: alias one, e.g.
// import { Text as DtText } from '@debdaru07/react-native';`,
  },
  flutter: {
    lang: 'dart',
    file: 'lib/main.dart',
    note: 'Use inside DynamicThemeApp: Dt* widgets wrap Material 3 widgets, so ThemeData from the theme styles them.',
    code: `import 'package:theme_studio/theme_studio.dart';
// DtButton, DtTextField, DtCard, showDtConfirmDialog, showDtToast…`,
  },
};

const TONE = `'success' | 'warning' | 'error' | 'info'`;

export const COMPONENTS: ComponentDoc[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'Actions',
    summary: 'The main action on a screen or in a dialog. With no variant it uses the theme’s button style.',
    tokens: ['components.button.*', 'color.primary / onPrimary', 'typography labelLarge', 'effects.opacity'],
    a11y: ['Native <button>; disabled and loading block clicks.', 'Loading sets aria-busy and keeps the width.', 'Use one filled button per view; put the primary action last in dialogs.'],
    props: [
      { name: 'variant', type: `'filled' | 'tonal' | 'outlined' | 'text' | 'danger'`, default: 'theme', description: 'Visual emphasis. Defaults to components.button.variant.' },
      { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Height from sizing.controlHeight.' },
      { name: 'icon', type: 'ReactNode', description: 'Icon next to the label.' },
      { name: 'iconPosition', type: `'start' | 'end'`, default: `'start'`, description: 'Side of the icon.' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Spinner, aria-busy, no clicks.' },
      { name: 'block', type: 'boolean', default: 'false', description: 'Full width.' },
      { name: 'href', type: 'string', description: 'Renders a link styled as a button.' },
    ],
    native: `<Button title onPress variant? size? icon? loading? disabled? block? />`,
    flutter: `DtButton(label:, onPressed:, icon?, variant?, danger?, text?, loading?)`,
    code: {
      web: `<button class="dts-button dts-button--filled">Save changes</button>
<button class="dts-button dts-button--outlined">Cancel</button>
<button class="dts-button dts-button--danger dts-button--sm">Delete</button>

<!-- Loading: keep the label for width, add a spinner -->
<button class="dts-button dts-button--filled" aria-busy="true" disabled>
  Saving <span class="dts-spinner dts-spinner--sm" aria-hidden="true"></span>
</button>`,
      react: `<Button onClick={save}>Save changes</Button>          {/* theme variant */}
<Button variant="outlined" onClick={cancel}>Cancel</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button loading={isSaving} icon={<PlusIcon />}>New shipment</Button>
<Button href="/orders" variant="text">View orders</Button>`,
      'react-native': `<Button title="Save changes" onPress={save} />
<Button title="Cancel" variant="outlined" onPress={cancel} />
<Button title="Delete" variant="danger" size="sm" onPress={remove} />
<Button title="Saving" loading block />`,
      flutter: `DtButton(label: 'Save changes', onPressed: save)              // theme variant
DtButton(label: 'Cancel', variant: DtButtonVariant.outlined, onPressed: cancel)
DtButton(label: 'Delete', danger: true, onPressed: remove)
DtButton(label: 'Later', text: true, onPressed: later)
DtButton(label: 'Saving', loading: true, onPressed: save)`,
    },
  },
  {
    id: 'icon-button',
    name: 'IconButton',
    category: 'Actions',
    summary: 'Icon-only action (search, close, more). Sized to the theme’s minimum touch target.',
    tokens: ['sizing.minTouchTarget', 'sizing.icon.md', 'color.secondaryContainer'],
    a11y: ['label is required: it is the accessible name and the tooltip.', 'Touch target ≥ sizing.minTouchTarget (48px by default).'],
    props: [
      { name: 'label', type: 'string', description: 'Accessible name (required).' },
      { name: 'variant', type: `'standard' | 'filled' | 'tonal' | 'outlined'`, default: `'standard'`, description: 'Emphasis.' },
      { name: 'children', type: 'ReactNode', description: 'The icon.' },
    ],
    native: `<IconButton label icon onPress variant? disabled? />`,
    flutter: `DtIconButton(label:, icon:, onPressed:, variant?)`,
    code: {
      web: `<button class="dts-icon-button" aria-label="Search">
  <svg aria-hidden="true">…</svg>
</button>
<button class="dts-icon-button dts-icon-button--filled" aria-label="Add">…</button>`,
      react: `<IconButton label="Search" onClick={openSearch}>
  <SearchIcon />
</IconButton>
<IconButton label="Add" variant="filled"><PlusIcon /></IconButton>`,
      'react-native': `<IconButton label="Search" icon={<SearchIcon />} onPress={openSearch} />
<IconButton label="Add" variant="filled" icon={<PlusIcon />} onPress={add} />`,
      flutter: `DtIconButton(label: 'Search', icon: const Icon(Icons.search), onPressed: openSearch)
DtIconButton(label: 'Add', variant: DtIconButtonVariant.filled, icon: const Icon(Icons.add), onPressed: add)`,
    },
  },
  {
    id: 'text-field',
    name: 'TextField',
    category: 'Inputs',
    summary: 'Labelled text input with hint, error and prefix/suffix. Outlined or filled from the theme.',
    tokens: ['components.input.*', 'color.outline / primary / error', 'typography bodyLarge, labelMedium, caption'],
    a11y: ['The label is always visible and linked to the input.', 'error sets aria-invalid and is read with the field (aria-describedby).', 'Use type/inputMode/autoComplete for the right keyboard and autofill.'],
    props: [
      { name: 'label', type: 'ReactNode', description: 'Visible label (required).' },
      { name: 'hint', type: 'ReactNode', description: 'Helper text under the field.' },
      { name: 'error', type: 'ReactNode', description: 'Error message; marks the field invalid.' },
      { name: 'prefix / suffix', type: 'ReactNode', description: 'Units, currency, icons.' },
      { name: 'multiline', type: 'boolean', default: 'false', description: 'Renders a textarea.' },
      { name: 'variant', type: `'outlined' | 'filled'`, default: 'theme', description: 'Defaults to components.input.variant.' },
      { name: '…input props', type: 'InputHTMLAttributes', description: 'value, onChange, type, placeholder, disabled…' },
    ],
    native: `<TextField label value onChangeText hint? error? multiline? secureTextEntry? keyboardType? />`,
    flutter: `DtTextField(label:, controller?, onChanged?, placeholder?, hint?, error?, maxLines?, obscureText?)`,
    code: {
      web: `<div class="dts-field dts-field--outlined">
  <label class="dts-field__label" for="email">Email</label>
  <div class="dts-field__control">
    <input class="dts-field__input" id="email" type="email" autocomplete="email"
           aria-invalid="true" aria-describedby="email-error" />
  </div>
  <p class="dts-field__error" id="email-error">Enter a valid email address</p>
</div>`,
      react: `<TextField
  label="Email"
  type="email"
  autoComplete="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  hint="We send delivery updates here"
/>
<TextField label="Amount" prefix="$" suffix="NZD" inputMode="decimal" />
<TextField label="Notes" multiline />`,
      'react-native': `<TextField
  label="Email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  error={emailError}
/>`,
      flutter: `DtTextField(
  label: 'Email',
  controller: emailController,
  keyboardType: TextInputType.emailAddress,
  error: emailError,
  hint: 'We send delivery updates here',
)`,
    },
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Inputs',
    summary: 'Opt-in for one setting or agreement. The whole row is clickable.',
    tokens: ['color.primary', 'sizing.minTouchTarget', 'typography bodyMedium'],
    a11y: ['Native checkbox inside its label.', 'Row height ≥ the minimum touch target.'],
    props: [
      { name: 'label', type: 'ReactNode', description: 'Visible label (required).' },
      { name: '…input props', type: 'InputHTMLAttributes', description: 'checked, defaultChecked, onChange, disabled.' },
    ],
    native: `<Checkbox label value onValueChange disabled? />`,
    flutter: `DtCheckbox(label:, value:, onChanged:)`,
    code: {
      web: `<label class="dts-checkbox">
  <input type="checkbox" name="terms" /> I agree to the terms
</label>`,
      react: `<Checkbox label="I agree to the terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />`,
      'react-native': `<Checkbox label="I agree to the terms" value={agreed} onValueChange={setAgreed} />`,
      flutter: `DtCheckbox(label: 'I agree to the terms', value: agreed, onChanged: (v) => setState(() => agreed = v))`,
    },
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Inputs',
    summary: 'Turns a setting on or off immediately (no Save button).',
    tokens: ['color.primary / onPrimary', 'color.outline', 'motion.duration.medium'],
    a11y: ['role="switch": read as on/off.', 'Use a checkbox instead when the change needs a Save.'],
    props: [
      { name: 'label', type: 'ReactNode', description: 'Visible label (required).' },
      { name: '…input props', type: 'InputHTMLAttributes', description: 'checked, onChange, disabled.' },
    ],
    native: `<Switch label value onValueChange disabled? />`,
    flutter: `DtSwitch(label:, value:, onChanged:)`,
    code: {
      web: `<label class="dts-switch">
  <input type="checkbox" role="switch" checked /> Delivery alerts
</label>`,
      react: `<Switch label="Delivery alerts" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />`,
      'react-native': `<Switch label="Delivery alerts" value={alerts} onValueChange={setAlerts} />`,
      flutter: `DtSwitch(label: 'Delivery alerts', value: alerts, onChanged: (v) => setState(() => alerts = v))`,
    },
  },
  {
    id: 'chip',
    name: 'Chip',
    category: 'Inputs',
    summary: 'Filter and choice chips toggle; input chips show a value the user can remove.',
    tokens: ['components.chip.radius', 'color.secondaryContainer', 'color.outline'],
    a11y: ['Filter chips are toggle buttons (aria-pressed).', 'The remove button is labelled “Remove <value>”.'],
    props: [
      { name: 'selected', type: 'boolean', description: 'Makes it a toggle (filter/choice chip).' },
      { name: 'onRemove', type: '() => void', description: 'Input chip with a remove button.' },
      { name: 'removeLabel', type: 'string', description: 'Custom accessible name for remove.' },
      { name: 'icon', type: 'ReactNode', description: 'Leading icon.' },
    ],
    native: `<Chip label selected? onPress? onRemove? icon? />`,
    flutter: `DtChip(label:, selected?, onSelected?, onDeleted?, icon?)`,
    code: {
      web: `<button class="dts-chip" aria-pressed="true">Email</button>
<span class="dts-chip">Auckland
  <button class="dts-chip__remove" aria-label="Remove Auckland">×</button>
</span>`,
      react: `{channels.map((c) => (
  <Chip key={c} selected={selected.includes(c)} onClick={() => toggle(c)}>{c}</Chip>
))}
<Chip onRemove={() => removeCity('Auckland')}>Auckland</Chip>`,
      'react-native': `<Chip label="Email" selected={selected.includes('Email')} onPress={() => toggle('Email')} />
<Chip label="Auckland" onRemove={() => removeCity('Auckland')} />`,
      flutter: `DtChip(label: 'Email', selected: email, onSelected: (v) => setState(() => email = v))
DtChip(label: 'Auckland', onDeleted: () => removeCity('Auckland'))`,
    },
  },
  {
    id: 'status-chip',
    name: 'StatusChip',
    category: 'Display',
    summary: 'Read-only status (Delivered, Delayed, Failed) in a semantic tone.',
    tokens: ['color.<tone>Container / on<Tone>Container', 'components.chip.radius'],
    a11y: ['The word carries the meaning; color only reinforces it.', 'Not interactive; use Chip for filters.'],
    props: [
      { name: 'tone', type: `${TONE} | 'neutral'`, default: `'neutral'`, description: 'Semantic color.' },
      { name: 'children', type: 'ReactNode', description: 'Status text.' },
    ],
    native: `<StatusChip label tone? />`,
    flutter: `DtStatusChip(label:, tone: DtTone.success)`,
    code: {
      web: `<span class="dts-status dts-status--success">Delivered</span>
<span class="dts-status dts-status--warning">Delayed</span>`,
      react: `<StatusChip tone="success">Delivered</StatusChip>
<StatusChip tone="warning">Delayed</StatusChip>`,
      'react-native': `<StatusChip label="Delivered" tone="success" />`,
      flutter: `const DtStatusChip(label: 'Delivered', tone: DtTone.success)`,
    },
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'Display',
    summary: 'Unread count or a dot on an icon or avatar.',
    tokens: ['color.error / onError', 'components.badge.radius'],
    a11y: ['label is what screen readers hear (“3 unread messages”).', 'Counts above max show “99+”.'],
    props: [
      { name: 'label', type: 'string', description: 'Spoken text (required).' },
      { name: 'count', type: 'number', description: 'Number to show.' },
      { name: 'max', type: 'number', default: '99', description: 'Cap before “99+”.' },
      { name: 'dot', type: 'boolean', default: 'false', description: 'Dot without a number.' },
      { name: 'children', type: 'ReactNode', description: 'Element the badge sits on.' },
    ],
    native: `<Badge label count? max? dot?>{child}</Badge>`,
    flutter: `DtBadge(label:, count?, max?, dot?, child:)`,
    code: {
      web: `<span class="dts-badge-anchor">
  <button class="dts-icon-button" aria-label="Messages">…</button>
  <span class="dts-badge" role="status" aria-label="3 unread messages">3</span>
</span>`,
      react: `<Badge count={unread} label={\`\${unread} unread messages\`}>
  <IconButton label="Messages"><BellIcon /></IconButton>
</Badge>`,
      'react-native': `<Badge count={unread} label={\`\${unread} unread messages\`}>
  <IconButton label="Messages" icon={<BellIcon />} onPress={openInbox} />
</Badge>`,
      flutter: `DtBadge(label: '$unread unread messages', count: unread, child: const Icon(Icons.notifications))`,
    },
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Display',
    summary: 'Groups related content. Elevated (theme shadow), outlined or filled; optional media, title and actions.',
    tokens: ['components.card.radius / elevation / bordered', 'spacing.component.cardPadding', 'color.surface'],
    a11y: ['title renders as a heading (h3).', 'href makes the whole card one link; don’t put buttons inside a linked card.'],
    props: [
      { name: 'variant', type: `'elevated' | 'outlined' | 'filled'`, default: `'elevated'`, description: 'Surface style.' },
      { name: 'title / subtitle', type: 'ReactNode', description: 'Heading and supporting line.' },
      { name: 'media', type: 'ReactNode', description: 'Edge-to-edge image or chart on top.' },
      { name: 'actions', type: 'ReactNode', description: 'Buttons along the bottom.' },
      { name: 'href', type: 'string', description: 'Whole card navigates.' },
      { name: 'flush', type: 'boolean', default: 'false', description: 'No padding (lists inside).' },
    ],
    native: `<Card variant? title? subtitle? media? actions? onPress?>{children}</Card>`,
    flutter: `DtCard(variant?, title?, subtitle?, media?, actions?, onTap?, child?)`,
    code: {
      web: `<article class="dts-card">
  <h3 class="dts-card__title">Next booking</h3>
  <p class="dts-card__subtitle">Thu 14 Nov · 09:30</p>
  <p class="dts-card__body">Two items need attention before your visit.</p>
  <div class="dts-card__actions">
    <button class="dts-button dts-button--text">Details</button>
    <button class="dts-button dts-button--filled">Reschedule</button>
  </div>
</article>
<div class="dts-card dts-card--outlined">…</div>`,
      react: `<Card
  title="Next booking"
  subtitle="Thu 14 Nov · 09:30"
  actions={<><Button variant="text">Details</Button><Button>Reschedule</Button></>}
>
  <Text muted>Two items need attention before your visit.</Text>
</Card>
<Card variant="outlined" href="/orders/1042" title="NW-1042" subtitle="Auckland CBD" />`,
      'react-native': `<Card
  title="Next booking"
  subtitle="Thu 14 Nov · 09:30"
  actions={<Button title="Reschedule" onPress={reschedule} />}
>
  <Text muted>Two items need attention before your visit.</Text>
</Card>`,
      flutter: `DtCard(
  title: 'Next booking',
  subtitle: 'Thu 14 Nov · 09:30',
  actions: [DtButton(label: 'Reschedule', onPressed: reschedule)],
  child: const Text('Two items need attention before your visit.'),
)`,
    },
  },
  {
    id: 'stat-card',
    name: 'StatCard',
    category: 'Display',
    summary: 'One metric with its label and change, for dashboards.',
    tokens: ['typography headline (tabular figures)', 'card tokens', 'tone colors for the delta'],
    a11y: ['Put the direction in the delta text (“+12%”), not only its color.'],
    props: [
      { name: 'label', type: 'ReactNode', description: 'What is measured.' },
      { name: 'value', type: 'ReactNode', description: 'The number.' },
      { name: 'delta', type: 'ReactNode', description: 'Change, e.g. “+12%”.' },
      { name: 'deltaTone', type: `${TONE} | 'neutral'`, default: `'neutral'`, description: 'Color of the delta.' },
    ],
    native: `<StatCard label value delta? deltaTone? />`,
    flutter: `DtStatCard(label:, value:, delta?, deltaTone?)`,
    code: {
      web: `<div class="dts-card dts-stat">
  <p class="dts-stat__label">On-time rate</p>
  <p class="dts-stat__value">96.4%</p>
  <span class="dts-status dts-status--success dts-stat__delta">+0.8%</span>
</div>`,
      react: `<StatCard label="On-time rate" value="96.4%" delta="+0.8%" deltaTone="success" />`,
      'react-native': `<StatCard label="On-time rate" value="96.4%" delta="+0.8%" deltaTone="success" />`,
      flutter: `const DtStatCard(label: 'On-time rate', value: '96.4%', delta: '+0.8%', deltaTone: DtTone.success)`,
    },
  },
  {
    id: 'list',
    name: 'List & ListItem',
    category: 'Display',
    summary: 'Rows with a headline, supporting text, and leading/trailing slots (avatar, status, chevron).',
    tokens: ['typography bodyLarge / bodyMedium', 'color.outlineMuted dividers', 'effects.opacity.hover'],
    a11y: ['Rows are buttons or links only when they do something.', 'Long headlines truncate with an ellipsis.'],
    props: [
      { name: 'headline', type: 'ReactNode', description: 'Main line (required).' },
      { name: 'supporting', type: 'ReactNode', description: 'Second line.' },
      { name: 'leading / trailing', type: 'ReactNode', description: 'Avatar, icon, status, chevron.' },
      { name: 'href / onClick', type: 'string / () => void', description: 'Makes the row interactive.' },
    ],
    native: `<ListItem headline supporting? leading? trailing? onPress? divider? />`,
    flutter: `DtListItem(headline:, supporting?, leading?, trailing?, onTap?)`,
    code: {
      web: `<ul class="dts-list">
  <li>
    <a class="dts-list-item dts-list-item--interactive" href="/orders/1042">
      <span class="dts-list-item__content">
        <span class="dts-list-item__headline">NW-1042</span>
        <span class="dts-list-item__supporting">To Auckland CBD</span>
      </span>
      <span class="dts-list-item__trailing"><span class="dts-status dts-status--success">Delivered</span></span>
    </a>
  </li>
</ul>`,
      react: `<Card flush>
  <List>
    {orders.map((o) => (
      <ListItem
        key={o.id}
        href={\`/orders/\${o.id}\`}
        leading={<Avatar name={o.customer} size="sm" />}
        headline={o.id}
        supporting={\`To \${o.city}\`}
        trailing={<StatusChip tone={o.tone}>{o.status}</StatusChip>}
      />
    ))}
  </List>
</Card>`,
      'react-native': `<Card>
  {orders.map((o, i) => (
    <ListItem key={o.id} divider={i > 0} headline={o.id} supporting={\`To \${o.city}\`}
      trailing={<StatusChip label={o.status} tone={o.tone} />} onPress={() => open(o)} />
  ))}
</Card>`,
      flutter: `Column(children: [
  for (final o in orders)
    DtListItem(headline: o.id, supporting: 'To \${o.city}', trailing: DtStatusChip(label: o.status, tone: o.tone), onTap: () => open(o)),
])`,
    },
  },
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Display',
    summary: 'A person or company as a photo, or initials in the primary container color.',
    tokens: ['color.primaryContainer / onPrimaryContainer', 'shape.radius.full'],
    a11y: ['name is the accessible name for both photo and initials.'],
    props: [
      { name: 'name', type: 'string', description: 'Used for initials and the accessible name.' },
      { name: 'src', type: 'string', description: 'Photo URL.' },
      { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: '32 / 40 / 56px.' },
    ],
    native: `<Avatar name uri? size? />`,
    flutter: `DtAvatar(name:, imageUrl?, size?)`,
    code: {
      web: `<span class="dts-avatar" role="img" aria-label="Sam Kirk"><span aria-hidden="true">SK</span></span>
<span class="dts-avatar dts-avatar--lg"><img src="/sam.jpg" alt="Sam Kirk" /></span>`,
      react: `<Avatar name="Sam Kirk" />
<Avatar name="Sam Kirk" src="/sam.jpg" size="lg" />`,
      'react-native': `<Avatar name="Sam Kirk" />
<Avatar name="Sam Kirk" uri="https://…/sam.jpg" size="lg" />`,
      flutter: `const DtAvatar(name: 'Sam Kirk')
DtAvatar(name: 'Sam Kirk', imageUrl: user.photoUrl, size: DtAvatarSize.lg)`,
    },
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'Feedback',
    summary: 'Inline message about the current view: info, success, warning or error, with optional actions.',
    tokens: ['color.<tone>Container / on<Tone>Container / <tone>', 'shape.radius.md'],
    a11y: ['Errors and warnings use role="alert" (announced at once); others role="status".', 'Every tone has an icon and text, never color alone.'],
    props: [
      { name: 'tone', type: TONE, default: `'info'`, description: 'Semantic color and icon.' },
      { name: 'title', type: 'ReactNode', description: 'Short summary.' },
      { name: 'children', type: 'ReactNode', description: 'Details.' },
      { name: 'actions', type: 'ReactNode', description: 'Buttons.' },
      { name: 'onClose', type: '() => void', description: 'Shows a dismiss button.' },
    ],
    native: `<Alert tone? title? message? actions? onClose? />`,
    flutter: `DtAlert(tone?, title?, message?, actions?, onClose?)`,
    code: {
      web: `<div class="dts-alert dts-alert--warning" role="alert">
  <span class="dts-alert__icon"><svg aria-hidden="true">…</svg></span>
  <div class="dts-alert__content">
    <p class="dts-alert__title">Driver running late</p>
    <div class="dts-alert__body">NW-1044 is 25 minutes behind schedule.</div>
  </div>
</div>`,
      react: `<Alert tone="warning" title="Driver running late" actions={<Button size="sm" variant="outlined">Notify customer</Button>}>
  NW-1044 is 25 minutes behind schedule.
</Alert>
<Alert tone="info" title="Scheduled maintenance" onClose={dismiss}>Tracking pauses Sunday 02:00–03:00.</Alert>`,
      'react-native': `<Alert tone="warning" title="Driver running late" message="NW-1044 is 25 minutes behind schedule." onClose={dismiss} />`,
      flutter: `DtAlert(tone: DtTone.warning, title: 'Driver running late', message: 'NW-1044 is 25 minutes behind schedule.', onClose: dismiss)`,
    },
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'Feedback',
    summary: 'Brief confirmation after an action (“Draft saved”), with an optional Undo. Disappears on its own.',
    tokens: ['color.onSurface / surface (inverted)', 'elevation level3', 'motion.duration.medium'],
    a11y: ['Announced politely; never takes focus.', '4s by default, 6s with an action; 0 keeps it open.'],
    props: [
      { name: 'open', type: 'boolean', description: 'Visible or not.' },
      { name: 'message', type: 'ReactNode', description: 'What happened.' },
      { name: 'actionLabel / onAction', type: 'string / () => void', description: 'One short action, e.g. Undo.' },
      { name: 'onClose', type: '() => void', description: 'Called on timeout and after the action.' },
      { name: 'duration', type: 'number (ms)', default: '4000', description: '0 = until closed.' },
    ],
    native: `<Toast visible message actionLabel? onAction? onClose duration? />`,
    flutter: `showDtToast(context, message, actionLabel?, onAction?, duration?)`,
    code: {
      web: `<div class="dts-toast" role="status" aria-live="polite">
  <span class="dts-toast__message">Order archived</span>
  <button class="dts-toast__action">Undo</button>
</div>`,
      react: `const [toast, setToast] = useState(false);

<Toast open={toast} message="Order archived" actionLabel="Undo" onAction={restore} onClose={() => setToast(false)} />`,
      'react-native': `<Toast visible={toast} message="Order archived" actionLabel="Undo" onAction={restore} onClose={() => setToast(false)} />`,
      flutter: `showDtToast(context, 'Order archived', actionLabel: 'Undo', onAction: restore);`,
    },
  },
  {
    id: 'progress',
    name: 'Progress & Spinner',
    category: 'Feedback',
    summary: 'Linear progress for known amounts (uploads); spinners for waits of unknown length.',
    tokens: ['color.primary / secondaryContainer', 'motion.easing.standard'],
    a11y: ['role="progressbar" with a label; aria-valuenow only when the value is known.', 'Reduced motion keeps a slow spin so loading still reads.'],
    props: [
      { name: 'label', type: 'string', description: 'What is progressing (required).' },
      { name: 'value', type: 'number (0–100)', description: 'Omit for indeterminate.' },
      { name: 'Spinner size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: '16 / 24 / 40px.' },
    ],
    native: `<Progress label value? />  (indeterminate = ActivityIndicator)`,
    flutter: `DtProgress(label:, value?)  ·  CircularProgressIndicator()`,
    code: {
      web: `<div class="dts-progress" role="progressbar" aria-label="Uploading manifest"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="64">
  <div class="dts-progress__bar" style="width: 64%"></div>
</div>
<span class="dts-spinner" role="progressbar" aria-label="Loading"></span>`,
      react: `<Progress label="Uploading manifest" value={percent} />
<Progress label="Syncing" />          {/* indeterminate */}
<Spinner size="sm" label="Loading orders" />`,
      'react-native': `<Progress label="Uploading manifest" value={percent} />
<Progress label="Syncing" />`,
      flutter: `DtProgress(label: 'Uploading manifest', value: percent)
const DtProgress(label: 'Syncing')`,
    },
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Feedback',
    summary: 'Placeholder shapes while content loads, so the layout doesn’t jump.',
    tokens: ['color.surfaceContainer / surfaceContainerHigh', 'card radius for rect'],
    a11y: ['Hidden from screen readers: announce loading once elsewhere (e.g. a status line).'],
    props: [
      { name: 'variant', type: `'text' | 'circle' | 'rect'`, default: `'text'`, description: 'Shape.' },
      { name: 'lines', type: 'number', default: '1', description: 'Text lines; the last is shorter.' },
      { name: 'width / height', type: 'CSS length', description: 'Size override.' },
    ],
    native: `<Skeleton variant? lines? width? height? />`,
    flutter: `DtSkeleton(variant?, lines?, width?, height?)`,
    code: {
      web: `<span class="dts-skeleton dts-skeleton--circle" aria-hidden="true"></span>
<span class="dts-skeleton dts-skeleton--text" aria-hidden="true"></span>
<span class="dts-skeleton dts-skeleton--rect" aria-hidden="true"></span>`,
      react: `{loading ? (
  <Card><Skeleton variant="circle" /><Skeleton lines={3} /></Card>
) : (
  <OrderCard order={order} />
)}`,
      'react-native': `{loading ? <Skeleton lines={3} /> : <OrderCard order={order} />}`,
      flutter: `loading ? const DtSkeleton(lines: 3) : OrderCard(order: order)`,
    },
  },
  {
    id: 'empty-state',
    name: 'EmptyState',
    category: 'Feedback',
    summary: 'Explains why a view is empty and offers the action that fills it.',
    tokens: ['typography titleLarge / bodyMedium', 'color.secondaryContainer (icon)'],
    a11y: ['title is a heading.', 'Offer one clear action.'],
    props: [
      { name: 'title', type: 'ReactNode', description: 'What is missing (required).' },
      { name: 'description', type: 'ReactNode', description: 'Why, and what to do.' },
      { name: 'icon', type: 'ReactNode', description: 'Illustrative icon.' },
      { name: 'actions', type: 'ReactNode', description: 'Usually one primary button.' },
    ],
    native: `<EmptyState title description? icon? actions? />`,
    flutter: `DtEmptyState(title:, description?, icon?, actions?)`,
    code: {
      web: `<div class="dts-empty">
  <div class="dts-empty__icon"><svg aria-hidden="true">…</svg></div>
  <h3 class="dts-empty__title">No shipments yet</h3>
  <p class="dts-empty__body">Create your first shipment to see live tracking here.</p>
  <div class="dts-empty__actions"><button class="dts-button dts-button--filled">New shipment</button></div>
</div>`,
      react: `<EmptyState
  icon={<TruckIcon />}
  title="No shipments yet"
  description="Create your first shipment to see live tracking here."
  actions={<Button onClick={create}>New shipment</Button>}
/>`,
      'react-native': `<EmptyState title="No shipments yet" description="Create your first shipment to see live tracking here."
  actions={<Button title="New shipment" onPress={create} />} />`,
      flutter: `DtEmptyState(
  icon: const Icon(Icons.local_shipping_outlined),
  title: 'No shipments yet',
  description: 'Create your first shipment to see live tracking here.',
  actions: [DtButton(label: 'New shipment', onPressed: create)],
)`,
    },
  },
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'Overlays',
    summary: 'Modal for a focused task or decision: alert, form, or anything that needs an answer first.',
    tokens: ['components.dialog.radius / elevation', 'spacing.component.dialogPadding', 'color.scrim'],
    a11y: ['Focus moves in on open, Tab stays inside, Escape closes, focus returns to the trigger.', 'Labelled by its title; description is linked.', 'dismissible={false} for required decisions.'],
    props: [
      { name: 'open / onClose', type: 'boolean / () => void', description: 'Visibility and close request.' },
      { name: 'title', type: 'ReactNode', description: 'Dialog name (required).' },
      { name: 'description', type: 'ReactNode', description: 'Explanation under the title.' },
      { name: 'icon', type: 'ReactNode', description: 'Centered icon for alert dialogs.' },
      { name: 'actions', type: 'ReactNode', description: 'Buttons; primary last.' },
      { name: 'dismissible', type: 'boolean', default: 'true', description: 'Escape and scrim click close it.' },
      { name: 'role', type: `'dialog' | 'alertdialog'`, default: `'dialog'`, description: 'alertdialog for interruptions.' },
    ],
    native: `<Dialog visible onClose title description? icon? actions? dismissible?>{children}</Dialog>`,
    flutter: `showDialog(context: context, builder: (_) => DtDialog(title:, description?, icon?, actions:, child?))`,
    code: {
      web: `<!-- Native <dialog> works with the same classes: dialog.showModal() -->
<dialog class="dts-dialog" aria-labelledby="rename-title">
  <h2 class="dts-dialog__title" id="rename-title">Rename route</h2>
  <p class="dts-dialog__body">Drivers see this name in their app.</p>
  <div class="dts-dialog__actions">
    <button class="dts-button dts-button--text" value="cancel">Cancel</button>
    <button class="dts-button dts-button--filled" value="save">Save</button>
  </div>
</dialog>`,
      react: `<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Rename route"
  description="Drivers see this name in their app."
  actions={<><Button variant="text" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}
>
  <TextField label="Route name" value={name} onChange={(e) => setName(e.target.value)} />
</Dialog>`,
      'react-native': `<Dialog visible={open} onClose={() => setOpen(false)} title="Rename route"
  actions={<><Button title="Cancel" variant="text" onPress={() => setOpen(false)} /><Button title="Save" onPress={save} /></>}>
  <TextField label="Route name" value={name} onChangeText={setName} />
</Dialog>`,
      flutter: `showDialog(
  context: context,
  builder: (context) => DtDialog(
    title: 'Rename route',
    description: 'Drivers see this name in their app.',
    child: DtTextField(label: 'Route name', controller: nameController),
    actions: [
      DtButton(label: 'Cancel', text: true, onPressed: () => Navigator.pop(context)),
      DtButton(label: 'Save', onPressed: save),
    ],
  ),
);`,
    },
  },
  {
    id: 'confirm-dialog',
    name: 'ConfirmDialog',
    category: 'Overlays',
    summary: 'Two-button decision. Destructive confirms use the error color.',
    tokens: ['dialog tokens', 'color.error / onError (destructive)'],
    a11y: ['role="alertdialog".', 'Cancel gets focus first, so Enter never confirms a destructive action by accident.'],
    props: [
      { name: 'open', type: 'boolean', description: 'Visible or not.' },
      { name: 'title / description', type: 'ReactNode', description: 'The question and its consequence.' },
      { name: 'confirmLabel', type: 'string', description: 'Verb, e.g. “Delete client” (required).' },
      { name: 'cancelLabel', type: 'string', default: `'Cancel'`, description: 'Safe option.' },
      { name: 'onConfirm / onCancel', type: '() => void', description: 'Outcome handlers.' },
      { name: 'destructive', type: 'boolean', default: 'false', description: 'Error-colored confirm.' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Spinner on confirm while it runs.' },
    ],
    native: `<ConfirmDialog visible title confirmLabel onConfirm onCancel description? destructive? loading? />`,
    flutter: `final ok = await showDtConfirmDialog(context, title:, confirmLabel:, destructive?)`,
    code: {
      web: `<!-- Use the Dialog markup with role="alertdialog" and a danger button -->
<button class="dts-button dts-button--danger">Delete client</button>`,
      react: `<ConfirmDialog
  open={confirming}
  title="Delete Acme Logistics?"
  description="Their theme and history are removed. Apps fall back to the agency base theme."
  confirmLabel="Delete client"
  destructive
  loading={deleting}
  onConfirm={remove}
  onCancel={() => setConfirming(false)}
/>`,
      'react-native': `<ConfirmDialog visible={confirming} title="Delete Acme Logistics?" confirmLabel="Delete client"
  destructive onConfirm={remove} onCancel={() => setConfirming(false)} />`,
      flutter: `final ok = await showDtConfirmDialog(
  context,
  title: 'Delete Acme Logistics?',
  description: 'Their theme and history are removed.',
  confirmLabel: 'Delete client',
  destructive: true,
);
if (ok) remove();`,
    },
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    summary: 'Switches between views of the same thing (Summary, Tracking, Invoice).',
    tokens: ['color.primary indicator', 'typography labelLarge', 'color.outlineMuted divider'],
    a11y: ['ARIA tabs: arrow keys move, Home/End jump, only the active tab is in the Tab order.', 'label names the tab list.'],
    props: [
      { name: 'items', type: '{ id, label, content, disabled? }[]', description: 'Tabs and their panels.' },
      { name: 'label', type: 'string', description: 'Accessible name (required).' },
      { name: 'value / onChange', type: 'string / (id) => void', description: 'Controlled selection.' },
      { name: 'defaultValue', type: 'string', description: 'Uncontrolled start tab.' },
    ],
    native: `<Tabs label items value? defaultValue? onChange? />`,
    flutter: `DtTabs(items: [DtTabItem(label:, content:)], initialIndex?, onChanged?)`,
    code: {
      web: `<div class="dts-tabs" role="tablist" aria-label="Shipment">
  <button class="dts-tab" role="tab" aria-selected="true" aria-controls="p1" id="t1">Summary</button>
  <button class="dts-tab" role="tab" aria-selected="false" aria-controls="p2" id="t2" tabindex="-1">Tracking</button>
</div>
<div class="dts-tab-panel" role="tabpanel" id="p1" aria-labelledby="t1">…</div>`,
      react: `<Tabs
  label="Shipment"
  items={[
    { id: 'summary', label: 'Summary', content: <Summary /> },
    { id: 'tracking', label: 'Tracking', content: <Tracking /> },
    { id: 'invoice', label: 'Invoice', content: <Invoice /> },
  ]}
/>`,
      'react-native': `<Tabs label="Shipment" items={[
  { id: 'summary', label: 'Summary', content: <Summary /> },
  { id: 'tracking', label: 'Tracking', content: <Tracking /> },
]} />`,
      flutter: `const DtTabs(items: [
  DtTabItem(label: 'Summary', content: Summary()),
  DtTabItem(label: 'Tracking', content: Tracking()),
])`,
    },
  },
  {
    id: 'text',
    name: 'Text',
    category: 'Display',
    summary: 'Text in one of the theme’s 10 text styles.',
    tokens: ['typography.styles.*', 'color.onSurface / onSurfaceMuted'],
    a11y: ['Choose `as` for the semantics (h1–h4, p, label); the variant only sets the look.'],
    props: [
      { name: 'variant', type: 'TextStyleName', default: `'bodyMedium'`, description: 'display, headline, titleLarge … caption.' },
      { name: 'as', type: `'p' | 'span' | 'h1'…'h4' | 'div' | 'label'`, default: `'p'`, description: 'Element.' },
      { name: 'muted', type: 'boolean', default: 'false', description: 'Secondary text color.' },
    ],
    native: `<Text variant? muted? role?>…</Text>`,
    flutter: `Text('…', style: Theme.of(context).textTheme.headlineMedium)`,
    code: {
      web: `<h1 class="dts-text-headline">Your week</h1>
<p class="dts-text-body-medium dts-text-muted">Two items need attention.</p>`,
      react: `<Text as="h1" variant="headline">Your week</Text>
<Text muted>Two items need attention.</Text>`,
      'react-native': `<Text variant="headline" role="header">Your week</Text>
<Text muted>Two items need attention.</Text>`,
      flutter: `Text('Your week', style: Theme.of(context).textTheme.headlineMedium)`,
    },
  },
];
