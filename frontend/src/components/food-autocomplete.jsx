import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { api } from '../data'

export function FoodAutocomplete(props) {
  const { defaultValue, ...inputProps } = props
  const [suggestions, setSuggestions] = useState([]), [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(props.value ?? defaultValue ?? '')
  const query = String(props.value ?? entered)
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => api('food/suggest?q=' + encodeURIComponent(query)).then(result => {
      if (active) setSuggestions(result.suggestions || [])
    }).catch(() => { if (active) setSuggestions(query ? [] : ['Вискас', 'Royal Canin', 'Purina', 'Pro Plan']) }), 180)
    return () => { active = false; clearTimeout(timer) }
  }, [query])
  const listId = React.useId()
  return <div className="food-autocomplete">
    <Input {...inputProps} value={query} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open && suggestions.length > 0} aria-controls={listId} onFocus={event => { props.onFocus?.(event); setOpen(true) }} onBlur={event => { props.onBlur?.(event); window.setTimeout(() => setOpen(false), 120) }} onChange={event => { setEntered(event.target.value); props.onChange?.(event); setOpen(true) }} />
    {open && suggestions.length > 0 && <div className="food-suggestions" id={listId} role="listbox" aria-label="Популярные корма">
      {suggestions.map(name => <button type="button" role="option" aria-selected={name === query} key={name} onMouseDown={event => event.preventDefault()} onClick={() => { setEntered(name); props.onChange?.({ target: { value: name } }); setOpen(false) }}>{name}</button>)}
    </div>}
  </div>
}
