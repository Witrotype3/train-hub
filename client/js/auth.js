// Server-backed auth (temporary/demo). Users are stored on the server in users.json.
// The client keeps only the minimal current-user info in localStorage.

import { apiPost, apiGet } from './api.js'
import { STORAGE_KEYS, MESSAGES } from './constants.js'
import { handleError } from './utils.js'

const CURRENT_KEY = STORAGE_KEYS.CURRENT_USER

export function getCurrentUser(){
  try{ return JSON.parse(localStorage.getItem(CURRENT_KEY)) }catch(e){return null}
}

export function setCurrentUser(user){
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user))
}

export function logout(){
  localStorage.removeItem(CURRENT_KEY)
}

export async function signup({name,email,password}){
  try{
    const res = await apiPost('/signup', {name,email,password})
    if(res && res.ok){
      setCurrentUser({name:res.user.name,email:res.user.email})
      return {ok:true, user:res.user}
    }
    return {ok:false, error: res && res.error ? res.error : 'signup failed'}
  }catch(e){
    return {ok:false, error: handleError(e, 'signup')}
  }
}

export async function login(email,password){
  try{
    const res = await apiPost('/login', {email,password})
    if(res && res.ok){
      setCurrentUser({name:res.user.name,email:res.user.email})
      return {ok:true, user:res.user}
    }
    return {ok:false, error: res && res.error ? res.error : 'login failed'}
  }catch(e){
    return {ok:false, error: handleError(e, 'login')}
  }
}

export async function getUserData(email){
  const key = (email||'').toLowerCase().trim()
  if(!key) return null
  try{
    const res = await apiGet('/user', {email: key})
    if(res && res.ok) return {name: res.user.name, email: res.user.email, inventory: res.user.inventory || []}
    return null
  }catch(e){
    console.error('getUserData error', e)
    return null
  }
}

export async function saveUserData(user){
  const key = (user && user.email) || ''
  if(!key) return {ok:false}
  try{
    const res = await apiPost('/user', {email:key, inventory:user.inventory || []})
    return res
  }catch(e){
    console.error('saveUserData error', e)
    return {ok:false, error: handleError(e, 'save user data')}
  }
}
