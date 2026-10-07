import type { ButtonVariant, ControlSize } from '@debdaru07/schema';
import { createContext, useContext, useState, type ReactNode } from 'react';

export const COMPONENTS = [
  { id: 'button', label: 'Button' },
  { id: 'input', label: 'Text field' },
  { id: 'card', label: 'Card' },
  { id: 'chip', label: 'Chip' },
  { id: 'badge', label: 'Badge' },
  { id: 'dialog', label: 'Dialog' },
] as const;
export type ComponentId = (typeof COMPONENTS)[number]['id'];

/**
 * What the Components workspace is looking at. Shared by the inspector (left) and the specimen in the preview
 * pane (right), so clicking a specimen cell selects that size/variant in the inspector and vice versa.
 */
interface ComponentFocus {
  component: ComponentId;
  setComponent(id: ComponentId): void;
  size: ControlSize;
  setSize(size: ControlSize): void;
  variant: ButtonVariant;
  setVariant(variant: ButtonVariant): void;
  showSpacing: boolean;
  setShowSpacing(on: boolean): void;
}

const Ctx = createContext<ComponentFocus | null>(null);

export function ComponentFocusProvider({ children }: { children: ReactNode }) {
  const [component, setComponent] = useState<ComponentId>('button');
  const [size, setSize] = useState<ControlSize>('md');
  const [variant, setVariant] = useState<ButtonVariant>('filled');
  const [showSpacing, setShowSpacing] = useState(false);
  return (
    <Ctx.Provider value={{ component, setComponent, size, setSize, variant, setVariant, showSpacing, setShowSpacing }}>
      {children}
    </Ctx.Provider>
  );
}

export function useComponentFocus(): ComponentFocus {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useComponentFocus outside ComponentFocusProvider');
  return ctx;
}
