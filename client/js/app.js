import * as views from './views.js'
import * as auth from './auth.js'
import * as router from './router.js'

const routes = [
  { path: '/', render: views.renderHome },
  { path: '/login', render: views.renderLogin },
  { path: '/signup', render: views.renderSignup },
  { path: '/inventory', render: views.renderInventory },
  { path: '/recycling-bin', render: views.renderInventory }, // Recycling bin is part of inventory view
  { path: '/training/create', render: views.renderCreateTraining },
  { path: '/training/view', render: views.renderTrainingViewByQuery },
  { path: '/training/modules', render: views.renderTrainingModules },
  { path: '/training/videos', render: views.renderVideos },
  { path: '/training', render: views.renderTraining }
]

function renderNav() {
  const navEl = document.getElementById('nav')
  const user = auth.getCurrentUser()
  navEl.innerHTML = ''

  const createLink = (path, text, className = '') => {
    const a = document.createElement('a')
    a.href = path
    a.textContent = text
    if (className) a.className = className
    return a
  }

  navEl.appendChild(createLink('/', 'Home'))

  if (user) {
    navEl.appendChild(createLink('/inventory', 'Inventory'))
    navEl.appendChild(createLink('/training', 'Training'))

    const span = document.createElement('span')
    span.textContent = '  ' + (user.name || user.email)
    span.className = 'muted'
    navEl.appendChild(span)

    const btn = document.createElement('button')
    btn.className = 'primary'
    btn.textContent = 'Sign out'
    btn.addEventListener('click', () => { auth.logout(); router.navigate('/') })
    navEl.appendChild(btn)
  } else {
    const btnSignIn = document.createElement('button')
    btnSignIn.className = 'primary'
    btnSignIn.textContent = 'Sign in'
    btnSignIn.addEventListener('click', () => router.navigate('/login'))
    navEl.appendChild(btnSignIn)

    const btnSignUp = document.createElement('button')
    btnSignUp.textContent = 'Sign up'
    btnSignUp.addEventListener('click', () => router.navigate('/signup'))
    navEl.appendChild(btnSignUp)
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const appEl = document.getElementById('app')

  // Set up router
  router.setRoutes(routes, appEl)

  // Update nav when route changes
  window.addEventListener('route-changed', renderNav)

  // Render initial nav and route
  renderNav()
  router.onRoute()
})
