import * as views from './views.js'
import * as auth from './auth.js'

const routes = [
  {path:'#/', render: views.renderHome},
  {path:'#/login', render: views.renderLogin},
  {path:'#/signup', render: views.renderSignup},
  {path:'#/inventory', render: views.renderInventory},
  {path:'#/recycling-bin', render: views.renderRecyclingBin},
  {path:'#/training/modules', render: views.renderTrainingModules},
  {path:'#/training/videos', render: views.renderVideos},
  {path:'#/training', render: views.renderTraining}
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
    const a3 = document.createElement('a')
    a3.href = '#/recycling-bin'
    a3.textContent = '🗑️ Recycling Bin'
    navEl.appendChild(a3)
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
  // Try exact match first
  const exactMatch = routes.find(r=> r.path === hash)
  if(exactMatch) return exactMatch
  
  // For prefix matching, check longer paths first to avoid matching shorter ones
  const sortedRoutes = [...routes].sort((a, b) => b.path.length - a.path.length)
  const prefixMatch = sortedRoutes.find(r=> hash.startsWith(r.path))
  if(prefixMatch) return prefixMatch
  
  // Fallback to home
  return routes[0]
}

async function onRoute(){
  renderNav()
  const hash = location.hash || '#/'
  const r = findRoute(hash)
  try{ await r.render(appEl) }catch(e){ appEl.innerHTML = '<div class="card"><h2>Error</h2><pre>'+String(e)+'</pre></div>' }
}

window.addEventListener('hashchange', onRoute)
window.addEventListener('load', onRoute)
