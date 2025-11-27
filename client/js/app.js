import * as views from './views.js'
import * as auth from './auth.js'

const routes = [
  {path:'#/', render: views.renderHome},
  {path:'#/login', render: views.renderLogin},
  {path:'#/signup', render: views.renderSignup},
  {path:'#/inventory', render: views.renderInventory},
  {path:'#/training', render: views.renderTraining},
  {path:'#/training/modules', render: views.renderTrainingModules},
  {path:'#/training/videos', render: views.renderVideos}
]

const appEl = document.getElementById('app')
const navEl = document.getElementById('nav')

function renderNav(){
  const user = auth.getCurrentUser()
  navEl.innerHTML = ''
  const home = document.createElement('a')
  home.href = '#/'
  home.textContent = 'Home'
  navEl.appendChild(home)
  if(user){
    const a1 = document.createElement('a')
    a1.href = '#/inventory'
    a1.textContent = 'Inventory'
    navEl.appendChild(a1)
    const a2 = document.createElement('a')
    a2.href = '#/training'
    a2.textContent = 'Training'
    navEl.appendChild(a2)
    const span = document.createElement('span')
    span.textContent = '  ' + (user.name || user.email)
    span.className = 'muted'
    navEl.appendChild(span)
    const btn = document.createElement('button')
    btn.className = 'primary'
    btn.textContent = 'Sign out'
    btn.addEventListener('click', ()=>{ auth.logout(); onRoute() })
    navEl.appendChild(btn)
  }else{
    const btn = document.createElement('button')
    btn.className = 'primary'
    btn.textContent = 'Sign in'
    btn.addEventListener('click', ()=> location.hash = '#/login')
    navEl.appendChild(btn)
    const s = document.createElement('button')
    s.className = ''
    s.textContent = 'Sign up'
    s.addEventListener('click', ()=> location.hash = '#/signup')
    navEl.appendChild(s)
  }
}

function findRoute(hash){
  if(!hash) hash = '#/'
  const r = routes.find(r=> r.path === hash)
  // fallback to prefix match
  if(!r) return routes.find(r=> hash.startsWith(r.path)) || routes[0]
  return r
}

async function onRoute(){
  renderNav()
  const hash = location.hash || '#/'
  const r = findRoute(hash)
  try{ await r.render(appEl) }catch(e){ appEl.innerHTML = '<div class="card"><h2>Error</h2><pre>'+String(e)+'</pre></div>' }
}

window.addEventListener('hashchange', onRoute)
window.addEventListener('load', onRoute)
