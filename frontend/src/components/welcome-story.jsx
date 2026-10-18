import React from 'react'
import './welcome-story.css'

const PETS = [
  { species: 'cat', avatar: { color: '#c89365' } },
  { species: 'bird' },
  { species: 'snake' },
]

/** Decorative animals only; the welcome screen never shows profile records. */
export function WelcomeStory({ Pet }) {
  return <section className="auth-intro welcome-story">
    <p className="welcome-eyebrow">PetCare / дневник заботы</p>
    <h1>Забота о питомце.<br />Каждый день.</h1>
    <p className="welcome-description">Медкарта, питание и важные даты<br />в одном месте.</p>
    <div className="welcome-animals" aria-hidden="true">
      {PETS.map(pet => <Pet key={pet.species} pet={pet} decorative pose="stand" />)}
    </div>
  </section>
}
