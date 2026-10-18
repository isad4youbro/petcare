import React, { useMemo } from 'react'
import { PetSprite } from '../../vendor/pixel-pets/src/react.js'
import { avatarConfig } from '../avatar'
import { renderFrame } from '../../vendor/pixel-pets/src/index.js'

export function Pet({ pet, className = '', pose = 'stand', paused = false, decorative = false }) {
  const config = useMemo(() => avatarConfig(pet), [pet.name, pet.species, pet.avatar])
  const tag = useMemo(() => { const slots = renderFrame(config, pose, 0).slots; return slots.findIndex(slot => slot === 18) }, [config, pose])
  return <span className={'pet-avatar ' + className} aria-hidden={decorative || undefined}>
    {pet.pixelPhoto && pose === 'stand' ? <img className="pixel-photo" src={pet.pixelPhoto} alt={pet.name || 'Питомец'} /> : <PetSprite config={config} pose={pose} size={96} paused={paused} className="pet-sprite" title={pet.name || 'Питомец'} />}
    {pet.name && !pet.pixelPhoto && config.neck !== 'none' && tag >= 0 && <span className="pet-initial" style={{ left:((tag % 32 + .5) / 32 * 100) + '%', top:((Math.floor(tag / 32) + .5) / 32 * 100) + '%' }} aria-hidden="true">{Array.from(pet.name.trim())[0]?.toUpperCase()}</span>}
  </span>
}
