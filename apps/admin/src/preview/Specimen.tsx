import { Badge, Button, Card, Chip, Text, TextField } from '@debdaru07/react';
import { BUTTON_VARIANTS, CONTROL_SIZES } from '@debdaru07/schema';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { COMPONENTS, useComponentFocus, type ComponentId } from '../editor/components/focus.tsx';
import { Icon } from './icons.tsx';

const SIZE_LABEL = { sm: 'Small', md: 'Medium', lg: 'Large' } as const;

/** Measures the element marked `data-measure` and lists the values a developer would check in devtools. */
function Readout({ children }: { deps?: unknown[]; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<[string, string][]>([]);
  useLayoutEffect(() => {
    const el = root.current?.querySelector<HTMLElement>('[data-measure]');
    if (!el) return setRows((prev) => (prev.length ? [] : prev));
    const measure = () => {
      const s = getComputedStyle(el);
      const radius = parseFloat(s.borderTopLeftRadius);
      const next: [string, string][] = [
        // Layout size, not getBoundingClientRect(): the preview frame is CSS-scaled to fit the pane.
        ['Size', `${el.offsetWidth} × ${el.offsetHeight}`],
        ['Padding', `${parseFloat(s.paddingTop)} ${parseFloat(s.paddingRight)}`],
        ['Radius', radius >= 999 ? 'pill' : `${radius}`],
        ['Border', `${parseFloat(s.borderTopWidth)}`],
        ['Gap', s.gap === 'normal' ? '0' : `${parseFloat(s.gap)}`],
        ['Text', `${parseFloat(s.fontSize)} / ${s.fontWeight}`],
      ];
      // Re-measured every render, so only store real changes (otherwise setState would loop forever).
      setRows((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    // The ThemeProvider applies new variables after this effect, so measure again on the next frame; padding-only
    // changes don't resize the content box, so observe the border box.
    measure();
    const frame = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el, { box: 'border-box' });
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  });
  return (
    <div ref={root}>
      {children}
      {rows.length > 0 && (
        <dl className="spec-readout" aria-label="Measured values of the highlighted component (px)">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function ButtonSpecimen() {
  const { size, setSize, variant, setVariant } = useComponentFocus();
  return (
    <Readout deps={[size, variant]}>
      <div className="spec-grid" role="grid" aria-label="Button variants and sizes">
        <div className="spec-corner" />
        {CONTROL_SIZES.map((s) => (
          <div key={s} className={`spec-col ${s === size ? 'on' : ''}`} role="columnheader">
            {SIZE_LABEL[s]}
          </div>
        ))}
        {BUTTON_VARIANTS.map((v) => (
          <div key={v} className="spec-row" role="row">
            <div className={`spec-rowhead ${v === variant ? 'on' : ''}`} role="rowheader">
              {v}
            </div>
            {CONTROL_SIZES.map((s) => {
              const on = s === size && v === variant;
              return (
                <div
                  key={s}
                  role="gridcell"
                  aria-selected={on}
                  className={`spec-cell ${on ? 'on' : ''}`}
                  onClickCapture={(e) => {
                    e.preventDefault();
                    setSize(s);
                    setVariant(v);
                  }}
                  title={`Edit ${SIZE_LABEL[s].toLowerCase()} ${v}`}
                >
                  <span className="spec-cell-size" aria-hidden>{s.toUpperCase()}</span>
                  <Button variant={v} size={s} data-measure={on ? '' : undefined} tabIndex={-1}>
                    {v === 'danger' ? 'Delete' : 'Save'}
                  </Button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="spec-states">
        <span className="spec-label">States</span>
        <Button variant={variant} size={size} icon={<Icon name="plus" />}>
          With icon
        </Button>
        <Button variant={variant} size={size} loading>
          Loading
        </Button>
        <Button variant={variant} size={size} disabled>
          Disabled
        </Button>
      </div>
    </Readout>
  );
}

function InputSpecimen() {
  return (
    <Readout deps={[]}>
      <div className="spec-stack">
        <div className="spec-pair">
          <span className="spec-label">Outlined</span>
          <TextField variant="outlined" label="Email" placeholder="you@company.com" hint="We never share it" />
        </div>
        <div className="spec-pair">
          <span className="spec-label">Filled</span>
          <TextField variant="filled" label="Company" defaultValue="Northwind Freight" />
        </div>
        <div className="spec-pair">
          <span className="spec-label">Error</span>
          <TextField label="Phone" defaultValue="12" error="Enter a full phone number" />
        </div>
        <div className="spec-pair">
          <span className="spec-label">Disabled</span>
          <TextField label="Account ID" defaultValue="NW-1042" disabled />
        </div>
      </div>
      {/* Measure the default text field's control. */}
      <MeasureFirst selector=".spec-stack .dts-field__control" />
    </Readout>
  );
}

/** Marks the first element matching `selector` for the readout. */
function MeasureFirst({ selector }: { selector: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const root = ref.current?.closest('.spec-body');
    root?.querySelectorAll('[data-measure]').forEach((e) => e.removeAttribute('data-measure'));
    root?.querySelector(selector)?.setAttribute('data-measure', '');
  });
  return <span ref={ref} hidden />;
}

function CardSpecimen() {
  return (
    <Readout deps={[]}>
      <div className="spec-cards">
        <Card title="Vehicle check due" subtitle="3 vehicles · this week" actions={<><Button variant="text">Later</Button><Button>Book</Button></>}>
          Book an inspection slot to stay compliant.
        </Card>
        <Card variant="outlined" title="Outlined card">
          Same padding and gap, with a border instead of a shadow.
        </Card>
      </div>
      <MeasureFirst selector=".spec-cards .dts-card" />
    </Readout>
  );
}

function ChipSpecimen() {
  const [on, setOn] = useState(true);
  return (
    <Readout deps={[]}>
      <div className="spec-states">
        <Chip selected={on} onClick={() => setOn(!on)}>
          Selected
        </Chip>
        <Chip>Default</Chip>
        <Chip icon={<Icon name="truck" />}>With icon</Chip>
        <Chip onRemove={() => undefined} removeLabel="Remove Auckland">
          Auckland
        </Chip>
      </div>
      <MeasureFirst selector=".spec-states .dts-chip" />
    </Readout>
  );
}

function BadgeSpecimen() {
  return (
    <Readout deps={[]}>
      <div className="spec-states">
        <Badge count={3} label="3 new" />
        <Badge count={42} label="42 unread" />
        <Badge count={250} label="More than 99" />
        <Badge dot label="New activity" />
      </div>
      <MeasureFirst selector=".spec-states .dts-badge" />
    </Readout>
  );
}

function DialogSpecimen() {
  // A static copy of the SDK dialog's markup (the real one is modal), so it can be inspected in place.
  return (
    <Readout deps={[]}>
      <div className="spec-dialog-stage">
        <div className="dts-dialog spec-static-dialog" role="group" aria-label="Dialog specimen">
          <h2 className="dts-dialog__title">Cancel shipment?</h2>
          <p className="dts-dialog__body">The driver is notified and the order goes back to the depot.</p>
          <div className="dts-dialog__actions">
            <Button variant="text">Keep it</Button>
            <Button variant="danger">Cancel shipment</Button>
          </div>
        </div>
      </div>
      <MeasureFirst selector=".spec-static-dialog" />
    </Readout>
  );
}

const SPECIMENS: Record<ComponentId, () => ReactNode> = {
  button: ButtonSpecimen,
  input: InputSpecimen,
  card: CardSpecimen,
  chip: ChipSpecimen,
  badge: BadgeSpecimen,
  dialog: DialogSpecimen,
};

/**
 * The component being tuned, rendered by the real @debdaru07/react components in the client's theme.
 * Lives inside the preview's ThemeProvider, so device width and light/dark apply.
 */
export function Specimen() {
  const { component, showSpacing, setShowSpacing } = useComponentFocus();
  const Body = SPECIMENS[component];
  const label = COMPONENTS.find((c) => c.id === component)!.label;
  return (
    <div className={`spec ${showSpacing ? 'spec-spacing' : ''}`}>
      <div className="spec-head">
        <Text as="h2" variant="titleLarge">
          {label}
        </Text>
        <label className="spec-toggle">
          <input type="checkbox" checked={showSpacing} onChange={(e) => setShowSpacing(e.target.checked)} />
          Show spacing
        </label>
      </div>
      <div className="spec-body">
        <Body />
      </div>
    </div>
  );
}
