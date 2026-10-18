import React from 'react'
import { Button } from '@/components/ui/button'
import { Pet } from './pet'
import { Brand } from './brand'
import { homeUrl } from '../portfolio/config'

export function ErrorPage({ status = 404 }) {
  const forbidden = status === 403
  const pet = { name: '', species: 'cat', avatar: { shape: 'cat', color: '#8b91a5', secondary: '#e5d8c8', eyes: '#315c4b', pattern: 'plain' } }
  return <main className="error-page"><header><Brand /></header><section className="error-panel" role="alert">
    <Pet pet={pet} pose="sit" paused decorative />
    <span className="error-code">{forbidden ? '403' : '404'}</span>
    <h1>{forbidden ? 'Сюда пока нельзя' : 'Страница потерялась'}</h1>
    <p>{forbidden ? 'У грустного котика нет доступа к этому месту.' : 'Грустный котик тоже не нашёл эту страницу.'}</p>
    <Button onClick={() => { location.href = homeUrl }}>Вернуться в PetCare</Button>
    <small>Nam Ne DANO · PetCare</small>
  </section></main>
}
