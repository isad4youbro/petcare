import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Brand } from './brand'
import { ThemeToggle } from './theme-toggle'
import { api } from '../data'
import { WelcomeStory } from './welcome-story'

import { portfolioMode, homeUrl } from '../portfolio/config'

export function Auth({ onSuccess, startupError, Field, Pet }) {
  const [mode, setMode] = useState('register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try { await api(mode, { username, password }); setPassword(''); await onSuccess() }
    catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  async function demo() {
    if (busy) return
    setBusy(true); setError('')
    try { await api('demo', {}); await onSuccess() }
    catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  function switchMode(next) { setMode(next); setError(''); setPassword('') }
  if (portfolioMode) return <div className="auth-page"><header><Brand /><ThemeToggle /></header><main className="auth-main"><WelcomeStory Pet={Pet} /><section className="auth-form-section"><h2>Знакомьтесь с PetCare</h2><p>Шесть питомцев, их истории и пиксельный редактор. Всё можно попробовать без регистрации.</p><Button className="w-full" onClick={demo} disabled={busy}>Открыть дневник</Button><p className="field-hint">Это портфолио-демо: данные остаются в вашем браузере. Настоящие аккаунты, отправка сообщений и Telegram требуют отдельного сервера.</p><Button variant="outline" asChild><a href={homeUrl + '?tag=portfolio-pet-6'}>Карточка потерявшейся Торпедки</a></Button>{error && <p role="alert">{error}</p>}</section></main></div>
  return <div className="auth-page"><header><div className="auth-brand"><Brand /></div><ThemeToggle /></header>
    <main className="auth-main"><WelcomeStory Pet={Pet} /><section className="auth-form-section">
      <h2>{mode === 'register' ? 'Создать аккаунт' : 'Войти'}</h2>
      <div className="line-tabs"><button type="button" className={mode === 'register' ? 'active' : ''} aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>Регистрация</button><button type="button" className={mode === 'login' ? 'active' : ''} aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>Вход</button></div>
      <form onSubmit={submit}>
        <Field label="Имя пользователя"><Input name="username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={32} pattern="[A-Za-z][A-Za-z0-9_]{2,31}" aria-describedby="username-hint" required /><p id="username-hint" className="field-hint">3–32 символа: сначала латинская буква, затем буквы, цифры или _</p></Field>
        <Field label="Пароль"><Input name="password" value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={10} maxLength={128} aria-describedby={mode === 'register' ? 'password-hint' : undefined} required />{mode === 'register' && <p id="password-hint" className="field-hint">Не менее 10 символов. Сохраните пароль для следующего входа.</p>}</Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Подождите…' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}</Button>
      </form>
      {(error || startupError) && <div className="form-error" role="alert">{error || startupError}</div>}
      <div className="auth-demo"><Button variant="outline" className="w-full" disabled={busy} onClick={demo}>Попробовать без регистрации</Button></div>
      <nav className="auth-doc-links" aria-label="Документация проекта"><a href="/rfc">О проекте · RFC</a><a href="/swagger">API · Swagger</a></nav>
    </section></main></div>
}
