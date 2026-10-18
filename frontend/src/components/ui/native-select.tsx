import * as React from 'react'
import { Select } from 'radix-ui'
import { cn } from 'cn'
import { ChevronDownIcon } from '../pixel-icons'

const EMPTY_VALUE = '__petcare_empty_option__'
type SelectProps = Omit<React.ComponentProps<'select'>, 'size' | 'multiple'> & { size?: 'sm' | 'default' }

/** Keeps the existing form API while rendering an accessible pixel menu. */
function NativeSelect({ className, size = 'default', value, defaultValue, onChange, children, name, disabled, required, form, id, ...props }: SelectProps) {
  const [localValue, setLocalValue] = React.useState(String(defaultValue ?? ''))
  const selected = String(value ?? localValue)
  function change(next: string) {
    const actual = next === EMPTY_VALUE ? '' : next
    setLocalValue(actual)
    onChange?.({ target: { value: actual, name, id }, currentTarget: { value: actual, name, id } } as React.ChangeEvent<HTMLSelectElement>)
  }
  // Radix supplies the hidden native control for FormData and keyboard navigation.
  const triggerProps = props as unknown as React.ComponentProps<typeof Select.Trigger>
  return <Select.Root value={selected || EMPTY_VALUE} onValueChange={change} name={name} disabled={disabled} required={required} form={form}>
    <Select.Trigger {...triggerProps} id={id} data-slot="native-select" data-size={size} className={cn('pixel-select-trigger border border-input bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)}>
      <Select.Value /><Select.Icon><ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content position="popper" align="start" sideOffset={6} collisionPadding={10} className="pixel-select-menu">
      <Select.ScrollUpButton className="pixel-select-scroll">▲</Select.ScrollUpButton>
      <Select.Viewport className="pixel-select-viewport">{children}</Select.Viewport>
      <Select.ScrollDownButton className="pixel-select-scroll">▼</Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>
}

function NativeSelectOption({ value, children, disabled, className }: React.ComponentProps<'option'>) {
  return <Select.Item value={String(value ?? children ?? '') || EMPTY_VALUE} disabled={disabled} className={cn('pixel-select-option', className)}>
    <Select.ItemText>{children}</Select.ItemText><Select.ItemIndicator aria-hidden="true">■</Select.ItemIndicator>
  </Select.Item>
}

function NativeSelectOptGroup({ label, children, className }: React.ComponentProps<'optgroup'>) {
  return <Select.Group className={className}><Select.Label className="pixel-select-label">{label}</Select.Label>{children}</Select.Group>
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
