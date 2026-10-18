import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { NativeSelect, NativeSelectOption } from './ui/native-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Brand } from './brand'
import { Pet } from './pet'
import { ThemeToggle } from './theme-toggle'
import { speciesName } from '../avatar'
import { preparePhoto } from '../image-upload'

import { portfolioMode, homeUrl } from '../portfolio/config'
import { portfolioStore } from '../portfolio/store'

export const situations = { with_me: 'Питомец сейчас со мной', seen: 'Я видел питомца', tag_only: 'Я нашёл только ошейник или метку' }
export async function tagRequest(token, action, data) {
  if (portfolioMode) return portfolioStore().publicRequest(token, action, data)
  let response
  try { response = await fetch('/api/tags/public/' + encodeURIComponent(token) + (action ? '/' + action : ''), data === undefined ? { credentials:'omit' } : { method:'POST', credentials:'omit', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }) } catch { throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.') }
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Не удалось отправить сообщение'); return result
}
export function phoneHref(phone) { return phone && /^\+?[0-9]{7,15}$/.test(phone) && !/^\+?7000/.test(phone) ? 'tel:' + phone : '' }
export function messengerHref(info) { const contact=info.messengerContact; if (!contact || (info.messenger==='telegram' && contact.toLowerCase()==='petcareprod_bot')) return ''; return info.messenger==='telegram' ? 'https://t.me/'+encodeURIComponent(contact) : info.messenger==='vk' ? 'https://vk.com/'+encodeURIComponent(contact) : info.messenger==='whatsapp' && phoneHref(contact) ? 'https://wa.me/'+contact.replace(/\D/g,'') : '' }
function Call({ phone, children='Позвонить владельцу', className='', variant='default' }) { const link=phoneHref(phone); return link ? <Button variant={variant} asChild className={'call-owner '+className}><a href={link}>{children}</a></Button> : <Button variant={variant} className={'call-owner '+className} disabled>{children}</Button> }
function Lines({ entries }) { return entries.filter(([,value])=>value).map(([label,value])=><div className="tag-note" key={label}><h3>{label}</h3><p>{value}</p></div>) }

export function PublicTag({ token }) {
  const [profile,setProfile]=useState(null),[error,setError]=useState(''),[report,setReport]=useState(false),[loading,setLoading]=useState(true)
  async function load() { setLoading(true);setError(''); try { const result=await tagRequest(token);setProfile(result); if(result.status==='active') tagRequest(token,'scan',{}).catch(()=>{}) } catch(e){setError(e.message)} finally{setLoading(false)} }
  useEffect(()=>{load()},[token])
  const pet=profile?.pet,info=profile?.info||{},messenger=messengerHref(info)
  return <div className="finder-page"><header className="finder-header"><a href={homeUrl} aria-label="PetCare — главная"><Brand /></a><ThemeToggle /></header>
    {loading ? <main className="finder-state" role="status">Загружаем карточку…</main> : error ? <main className="finder-state"><h1>Не удалось загрузить карточку</h1><p>{error}</p><Button onClick={load}>Попробовать снова</Button></main> : profile?.status!=='active' ? <main className="finder-state"><h1>{profile?.status==='unactivated'?'Метка ещё не активирована':profile?.status==='disabled'?'Метка отключена':'Карточка недоступна'}</h1><p>{profile?.status==='unactivated'?'Владелец пока не заполнил карточку этой метки.':'Сведения владельца сейчас недоступны. Проверьте номер на ошейнике.'}</p><Button variant="outline" onClick={load}>Обновить</Button></main> : <main className="finder-content">
      {profile.example && <p className="tag-example">{portfolioMode ? 'Демо-карточка · личные контакты скрыты · сообщения остаются в вашем браузере' : 'Пример карточки · контакты вымышлены'}</p>}
      {info.lost && <div className="lost-status"><span className="pixel-status-mark" aria-hidden="true">!</span><div><strong>Я потерялся</strong><p>Помогите мне вернуться домой</p></div></div>}
      {(info.warning||info.healthAllergies||info.foodAllergies||info.healthRestrictions) && <aside className="finder-alert"><Lines entries={[["Важно",info.warning],["Аллергии",info.healthAllergies],["Пищевые аллергии",info.foodAllergies!==info.healthAllergies?info.foodAllergies:''],["Ограничения",info.healthRestrictions]]} /></aside>}
      <div className="finder-intro"><section className="finder-pet-card"><div className="finder-photo">{pet.photo ? <img src={pet.photo} alt={'Фото питомца '+pet.name} /> : <Pet pet={pet} decorative />}</div><div className="finder-identity"><h1>{pet.name}</h1><p>{[speciesName(pet),pet.breed,profile.age].filter(Boolean).join(' · ')}</p></div></section>
      <section className="finder-owner pixel-panel"><h2>Связаться с владельцем</h2>{info.ownerName && <p className="owner-name">{info.ownerName}</p>}{info.ownerPhone && <p className="owner-phone">{info.ownerPhone}</p>}<Call phone={info.ownerPhone} />{!info.ownerPhone && <p className="field-hint">Основной номер не указан</p>}{messenger && <Button variant="outline" asChild><a href={messenger} target="_blank" rel="noopener noreferrer">Написать в {({telegram:'Telegram',whatsapp:'WhatsApp',vk:'VK'})[info.messenger]}</a></Button>}
        {info.backupPhone && <div className="backup-contact"><h3>Запасной контакт</h3><p>{[info.backupName,info.backupRelation].filter(Boolean).join(' · ')}</p><p>{info.backupPhone}</p><Call phone={info.backupPhone} variant="outline">Позвонить по запасному номеру</Call></div>}<Button variant="outline" onClick={()=>setReport(true)}>Сообщить, где питомец</Button><details className="no-answer"><summary>Владелец не отвечает?</summary><p>{info.backupPhone?'Позвоните по запасному номеру. ':''}{messenger?'Попробуйте написать в мессенджер. ':''}{portfolioMode ? 'Это демонстрация. Сообщение сохранится только в вашем браузере и будет видно в разделе QR-метки дневника.' : 'Оставьте сообщение о месте встречи — оно сохранится у владельца.'}</p><Button variant="ghost" onClick={()=>setReport(true)}>Оставить сообщение</Button></details>
      </section></div>
      {(info.city||info.area||info.fullAddress) && <section className="finder-section pixel-panel"><h2>Где живёт</h2><p>{[info.city,info.area].filter(Boolean).join(' · ')}</p>{info.fullAddress && <details><summary>Полный адрес</summary><p>{info.fullAddress}</p></details>}</section>}
      {info.handling && <section className="finder-section pixel-panel"><h2>Как помочь питомцу</h2><p>{info.handling}</p></section>}
      <div className="finder-details"><section className="finder-section pixel-panel"><h2>Питание</h2>{[info.foodBrand,info.foodLine,info.foodAllowed,info.foodForbidden,info.foodAllergies,info.foodNotes,info.foodPhoto].some(Boolean) ? <Lines entries={[["Корм",[info.foodBrand,info.foodLine].filter(Boolean).join(' · ')],["Можно давать",info.foodAllowed],["Нельзя давать",info.foodForbidden],["Аллергии и непереносимость",info.foodAllergies],["Как кормить",info.foodNotes]]} /> : <p>Владелец не указал информацию о питании. Уточните её перед кормлением.</p>}{info.foodPhoto&&<img className="report-photo" src={info.foodPhoto} alt="Упаковка корма питомца"/>}</section>
      {[info.healthAllergies,info.healthConditions,info.healthRestrictions,info.specialNeeds,info.clinicName,info.clinicPhone].some(Boolean) && <section className="finder-section pixel-panel"><h2>Важное о здоровье</h2><p className="field-hint">Информация указана владельцем</p><Lines entries={[["Аллергии",info.healthAllergies],["Особенности здоровья",info.healthConditions],["Ограничения",info.healthRestrictions],["Особые потребности",info.specialNeeds],["Ветеринарная клиника",info.clinicName]]} />{info.clinicPhone && <a href={phoneHref(info.clinicPhone)||undefined}>{info.clinicPhone}</a>}</section>}</div>
      <div className="finder-sticky-call"><Call phone={info.ownerPhone} /></div>
      <Dialog open={report} onOpenChange={setReport}><DialogContent className="finder-report-dialog"><FinderReport token={token} pet={pet} info={info} close={()=>setReport(false)} example={profile.example} /></DialogContent></Dialog>
    </main>}<footer className="finder-footer">PetCare · Помогаем питомцам вернуться домой</footer></div>
}

function FinderReport({ token,pet,info,example,close }) {
  const [form,setForm]=useState({situation:'with_me',place:'',comment:'',finderName:'',finderPhone:'',seenAt:'',photo:''}),[when,setWhen]=useState('now'),[point,setPoint]=useState(null),[share,setShare]=useState(false),[geo,setGeo]=useState(''),[stage,setStage]=useState('edit'),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const requestId=useRef(crypto.randomUUID?.() || Math.random().toString(36).slice(2)+Date.now()),fileInput=useRef(null)
  const patch=value=>setForm(current=>({...current,...value}))
  async function locate(){setGeo('Определяем местоположение…');if(!navigator.geolocation){setGeo('Укажите адрес или ориентир вручную');return}navigator.geolocation.getCurrentPosition(position=>{setPoint({lat:position.coords.latitude,lon:position.coords.longitude});setShare(true);setGeo('Местоположение определено')},()=>{setPoint(null);setShare(false);setGeo('Укажите адрес или ориентир вручную')},{enableHighAccuracy:true,timeout:15000,maximumAge:60000})}
  async function photo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setError('')
    try { patch({ photo: await preparePhoto(file) }) }
    catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  function preview(e){e.preventDefault();setError('');if(!form.place.trim()&&!(point&&share)){setError('Укажите адрес, ориентир или местоположение');return}if(when==='past'&&(!form.seenAt||new Date(form.seenAt).getTime()>Date.now()+300000)){setError('Укажите время встречи без будущих дат');return}setStage('preview')}
  async function submit(){if(busy)return;setBusy(true);setError('');try{await tagRequest(token,'report',{...form,seenAt:when==='past'?new Date(form.seenAt).toISOString():'',...(point&&share?{location:point,shareLocation:true}:{}),requestId:requestId.current});setStage('success')}catch(e){setError('Не удалось отправить сообщение. Попробуйте ещё раз или позвоните владельцу. '+e.message)}finally{setBusy(false)}}
  return <><DialogHeader><DialogTitle>{stage==='success'?'Спасибо за помощь!':'Сообщить, где '+pet.name}</DialogTitle><DialogDescription>{stage==='preview'?'Проверьте, какие данные получит владелец':stage==='success'?'Ваше сообщение сохранено':'Регистрация не нужна'}</DialogDescription></DialogHeader>
    {stage==='success'?<div className="report-success"><p>{example?(portfolioMode?'Сообщение сохранено в этом браузере. В демо оно не отправляется реальному владельцу.':'Сообщение сохранено в пробной карточке.'):'Спасибо! Ваше сообщение сохранено. Мы уведомим владельца.'}</p><Call phone={info.ownerPhone} /><Button type="button" variant="outline" onClick={close}>Вернуться к карточке</Button></div>:stage==='preview'?<div className="report-preview"><Lines entries={[["Ситуация",situations[form.situation]],["Место",form.place],["Координаты",point&&share?`${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`:'Не передаются'],["Когда",when==='now'?'Сейчас':new Date(form.seenAt).toLocaleString('ru-RU')],["Комментарий",form.comment],["Имя",form.finderName],["Телефон",form.finderPhone]]} />{form.photo&&<img className="report-photo" src={form.photo} alt="Фото, которое получит владелец" />}<p className="field-hint">Будут переданы только сведения, показанные выше.</p>{error&&<p className="field-error" role="alert">{error}</p>}<div className="dialog-actions"><Button type="button" variant="outline" disabled={busy} onClick={()=>setStage('edit')}>Изменить</Button><Button type="button" disabled={busy} onClick={submit}>{busy?'Сохраняем…':portfolioMode?'Сохранить тестовое сообщение':'Отправить владельцу'}</Button></div></div>:<form className="finder-report-form" onSubmit={preview}>
      <label>Что произошло<NativeSelect value={form.situation} onChange={e=>patch({situation:e.target.value})}>{Object.entries(situations).map(([id,label])=><NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></label>
      <Button type="button" variant="outline" onClick={locate}>Указать моё местоположение</Button>{geo&&<p className="field-hint" role="status">{geo}</p>}{point&&<label className="checkbox-field"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)} />Передать координаты владельцу</label>}
      <label>Адрес или ориентир<Input value={form.place} onChange={e=>patch({place:e.target.value})} maxLength={500} placeholder="Улица, дом, ближайший ориентир" /></label><label>Когда встретили<NativeSelect value={when} onChange={e=>setWhen(e.target.value)}><NativeSelectOption value="now">Сейчас</NativeSelectOption><NativeSelectOption value="past">Другое время</NativeSelectOption></NativeSelect></label>{when==='past'&&<label>Дата и время<Input type="datetime-local" required value={form.seenAt} onChange={e=>patch({seenAt:e.target.value})} /></label>}
      <label>Комментарий<Textarea value={form.comment} onChange={e=>patch({comment:e.target.value})} maxLength={1500} placeholder="Как выглядит и в каком состоянии питомец" /></label><input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={photo} /><Button type="button" variant="outline" disabled={busy} onClick={()=>fileInput.current?.click()}>{busy?'Обрабатываем фото…':form.photo?'Заменить фото':'Добавить фото'}</Button>{form.photo&&<div><img className="report-photo" src={form.photo} alt="Добавленное фото" /><Button variant="ghost" type="button" onClick={()=>patch({photo:''})}>Убрать фото</Button></div>}
      <details><summary>Контакт для ответа · необязательно</summary><label>Ваше имя<Input value={form.finderName} maxLength={100} onChange={e=>patch({finderName:e.target.value})} autoComplete="name" /></label><label>Ваш телефон<Input type="tel" value={form.finderPhone} maxLength={30} onChange={e=>patch({finderPhone:e.target.value})} autoComplete="tel" /></label></details>{error&&<p className="field-error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>Проверить и отправить</Button><Call phone={info.ownerPhone} /></form>}
  </>
}
