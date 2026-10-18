import test from 'node:test'
import assert from 'node:assert/strict'

test('HTTP mobile fallback works and an expired demo never falls back to the real cookie', async () => {
  const originals = Object.fromEntries(['crypto','location','sessionStorage','BroadcastChannel','window','fetch'].map(k => [k,Object.getOwnPropertyDescriptor(globalThis,k)]))
  const values = new Map(), requests = [], dispatched = []
  function set(key,value) { Object.defineProperty(globalThis,key,{ value,writable:true,configurable:true }) }
  try {
    set('crypto', {}); set('location', {search:''}); set('BroadcastChannel', class {postMessage() {}})
    set('sessionStorage', { getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k) })
    set('window', { dispatchEvent:e=>dispatched.push(e.type) })
    set('fetch', async (url,options) => { requests.push({url,options}); return { ok:true,status:200,json:async()=>url.endsWith('/demo') ? {demoToken:'sandbox-test-session'} : {ok:true} } })
    const data = await import('./data.js?http-fallback-test')
    await data.api('state')
    await data.api('demo', {})
    assert.equal(values.get('petcare.demo'), 'sandbox-test-session')
    set('fetch', async (url,options) => { requests.push({url,options}); return {ok:false,status:401,json:async()=>({error:'Войдите в аккаунт'})} })
    await assert.rejects(data.api('state'), /Войдите/)
    await assert.rejects(data.api('telegram/unlink', {}), /Войдите/)
    assert.equal(requests.at(-1).options.headers['X-PetCare-Demo'], 'sandbox-test-session')
    assert.equal(values.get('petcare.demo'), 'sandbox-test-session')
    assert.deepEqual(dispatched, ['petcare-demo-expired','petcare-demo-expired'])
    await data.api('logout', {})
    assert.equal(values.has('petcare.demo'), false)
  } finally {
    for (const [key,descriptor] of Object.entries(originals)) { if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key] }
  }
})
