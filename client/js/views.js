import * as auth from './auth.js'
import * as training from './training.js'
import { navigate } from './router.js'

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag)
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v
    else if (k === 'style' && typeof v === 'string') e.style.cssText = v
    else if (k.startsWith('on')) {
      // allow attributes like onClick or onclick -> register proper event
      const ev = k.slice(2).toLowerCase()
      e.addEventListener(ev, v)
    } else if (v !== null && v !== undefined) e.setAttribute(k, v)
  })
  children.flat().forEach(c => { if (c == null) return; if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else e.appendChild(c) })
  return e
}

function showToast(message, type = 'error', timeout = 3500) {
  let container = document.querySelector('.toast-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  const t = document.createElement('div')
  t.className = 'toast ' + (type || '')
  t.textContent = message
  container.appendChild(t)
  setTimeout(() => { t.remove() }, timeout)
}


/**
 * Sets up Enter key navigation for a form
 * Pressing Enter moves to the next input or submits if it's the last input
 * @param {string} formSelector - CSS selector for the form container
 * @param {Function} onSubmit - Function to call when Enter is pressed on the last input
 */
function setupEnterKeyNavigation(formSelector, onSubmit) {
  // Wait for DOM to be ready
  setTimeout(() => {
    const form = document.querySelector(formSelector)
    if (!form) return

    const inputs = form.querySelectorAll('input, textarea, select')
    const submitButton = form.querySelector('button[class*="primary"], button[type="submit"]')

    inputs.forEach((input, index) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()

          if (index < inputs.length - 1) {
            // Move to next input
            inputs[index + 1].focus()
          } else {
            // Last input - submit the form
            if (submitButton) {
              submitButton.click()
            } else if (onSubmit) {
              onSubmit()
            }
          }
        }
      })
    })
  }, 0)
}

export function renderHome(appEl) {
  const user = auth.getCurrentUser()
  if (!user) {
    // Show login/signup when not logged in
    const hero = el('div', { class: 'hero-section' },
      el('h1', { class: 'hero-title' }, 'Welcome to Train Hub'),
      el('p', { class: 'hero-subtitle' }, 'Your comprehensive platform for inventory management and professional training.'),
      el('div', { class: 'hero-features' },
        el('div', { class: 'feature-item' },
          el('span', { class: 'feature-icon' }, '📦'),
          el('div', { class: 'feature-content' },
            el('h3', {}, 'Inventory Management'),
            el('p', { class: 'muted' }, 'Organize and track your items efficiently')
          )
        ),
        el('div', { class: 'feature-item' },
          el('span', { class: 'feature-icon' }, '🎓'),
          el('div', { class: 'feature-content' },
            el('h3', {}, 'Training Modules'),
            el('p', { class: 'muted' }, 'Access interactive training materials')
          )
        ),
        el('div', { class: 'feature-item' },
          el('span', { class: 'feature-icon' }, '🎥'),
          el('div', { class: 'feature-content' },
            el('h3', {}, 'Video Resources'),
            el('p', { class: 'muted' }, 'Learn from expert video tutorials')
          )
        )
      )
    )

    const ctaCard = el('div', { class: 'card cta-card' },
      el('h2', {}, 'Get Started Today'),
      el('p', { class: 'muted' }, 'Create your free account to start managing your inventory and accessing training resources.'),
      el('div', { class: 'cta-buttons' },
        el('button', { class: 'btn btn-large primary', onClick: () => navigate('/signup') }, 'Create Account'),
        el('button', { class: 'btn btn-large', onClick: () => navigate('/login') }, 'Sign In')
      )
    )

    appEl.appendChild(hero)
    appEl.appendChild(ctaCard)
    return
  }

  // Show training page content when logged in
  navigate('/training')
}

export function renderLogin(appEl) {
  appEl.innerHTML = ''
  const form = el('div', { class: 'card login-card' },
    el('div', { class: 'login-header' },
      el('h2', {}, 'Welcome Back'),
      el('p', { class: 'muted' }, 'Sign in to your account to continue')
    ),
    el('div', { class: 'form-row' },
      el('label', { for: 'email', class: 'form-label' }, 'Email Address'),
      el('input', { id: 'email', placeholder: 'you@example.com', type: 'email', autocomplete: 'email' })
    ),
    el('div', { class: 'form-row' },
      el('label', { for: 'password', class: 'form-label' }, 'Password'),
      el('input', { id: 'password', placeholder: 'Enter your password', type: 'password', autocomplete: 'current-password' })
    ),
    el('div', { class: 'actions' },
      el('button', { class: 'btn btn-large primary', onClick: onLogin }, 'Sign In'),
      el('button', { class: 'btn btn-large', onClick: () => navigate('/signup') }, 'Create Account')
    ),
    el('div', { class: 'login-footer' },
      el('p', { class: 'muted small' }, 'Don\'t have an account? '),
      el('a', { href: '/signup', class: 'link' }, 'Sign up here')
    ),
    el('div', { id: 'login-error', class: 'muted small' })
  )
  appEl.appendChild(form)

  async function onLogin() {
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    if (!email) { showToast('Please enter your email', 'error'); return }
    if (!password) { showToast('Please enter your password', 'error'); return }
    const res = await auth.login(email, password)
    if (!res.ok) { showToast(res.error || 'Login failed', 'error'); return }
    showToast('Signed in successfully', 'success')
    navigate('/inventory')
  }

  // Setup Enter key navigation
  setupEnterKeyNavigation('.login-card', onLogin)
}

export function renderSignup(appEl) {
  appEl.innerHTML = ''
  const form = el('div', { class: 'card signup-card' },
    el('div', { class: 'signup-header' },
      el('h2', {}, 'Create Your Account'),
      el('p', { class: 'muted' }, 'Join Train Hub and start managing your inventory today')
    ),
    el('div', { class: 'form-row' },
      el('label', { for: 'name', class: 'form-label' }, 'Full Name'),
      el('input', { id: 'name', placeholder: 'John Doe', type: 'text', autocomplete: 'name' })
    ),
    el('div', { class: 'form-row' },
      el('label', { for: 'email', class: 'form-label' }, 'Email Address'),
      el('input', { id: 'email', placeholder: 'you@example.com', type: 'email', autocomplete: 'email' })
    ),
    el('div', { class: 'form-row' },
      el('label', { for: 'password', class: 'form-label' }, 'Password'),
      el('input', { id: 'password', placeholder: 'Minimum 6 characters', type: 'password', autocomplete: 'new-password' }),
      el('p', { class: 'form-hint muted small' }, 'Password must be at least 6 characters long')
    ),
    el('div', { class: 'form-row' },
      el('label', { for: 'password-confirm', class: 'form-label' }, 'Confirm Password'),
      el('input', { id: 'password-confirm', placeholder: 'Re-enter your password', type: 'password', autocomplete: 'new-password' })
    ),
    el('div', { class: 'actions' },
      el('button', { class: 'btn btn-large primary', onClick: onSignup }, 'Create Account'),
      el('button', { class: 'btn btn-large', onClick: () => navigate('/login') }, 'Sign In Instead')
    ),
    el('div', { class: 'signup-footer' },
      el('p', { class: 'muted small' }, 'Already have an account? '),
      el('a', { href: '/login', class: 'link' }, 'Sign in here')
    ),
    el('div', { id: 'signup-error', class: 'muted small' })
  )
  appEl.appendChild(form)

  async function onSignup() {
    const name = document.getElementById('name').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    // basic client-side validation
    if (!name) { showToast('Name is required', 'error'); return }
    if (!email) { showToast('Email is required', 'error'); return }
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return }
    if (password !== passwordConfirm) { showToast('Passwords do not match', 'error'); return }
    const res = await auth.signup({ name, email, password })
    if (!res.ok) { showToast(res.error || 'Signup failed', 'error'); return }
    showToast('Account created successfully!', 'success')
    navigate('/inventory')
  }

  // Setup Enter key navigation
  setupEnterKeyNavigation('.signup-card', onSignup)
}

export async function renderInventory(appEl) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''
  const data = (await auth.getUserData(user.email)) || { inventory: [], deleted_inventory: [] }

  // Normalize inventory data - convert old string format to new object format
  function normalizeInventory(inventory) {
    if (!inventory || !Array.isArray(inventory)) return []
    return inventory.map((item, idx) => {
      // If it's already an object with the right structure, return it
      if (typeof item === 'object' && item !== null && 'description' in item) {
        return {
          ...item,
          quantity: parseInt(item.quantity) || 0,
          target_quantity: parseInt(item.target_quantity) || 0
        }
      }
      // If it's a string (old format), convert it to new format
      if (typeof item === 'string') {
        return {
          description: item,
          code: `LEGACY-${idx + 1}`,
          number: String(idx + 1),
          quantity: 1,
          target_quantity: 1
        }
      }
      // Fallback for unexpected formats
      return {
        description: String(item),
        code: `UNKNOWN-${idx + 1}`,
        number: String(idx + 1),
        quantity: 0,
        target_quantity: 0
      }
    })
  }

  // Normalize the inventory data
  data.inventory = normalizeInventory(data.inventory)
  data.deleted_inventory = normalizeInventory(data.deleted_inventory)

  const header = el('div', { class: 'inventory-header', style: 'display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem;' },
    el('div', {},
      el('h1', {}, 'Your Inventory'),
      el('p', { class: 'muted' }, `You have ${data.inventory?.length || 0} item${data.inventory?.length !== 1 ? 's' : ''} in your inventory`)
    ),
    el('div', { class: 'search-container', style: 'width:300px;' },
      el('input', {
        id: 'inventory-search',
        placeholder: '🔍 Search inventory...',
        type: 'text',
        style: 'width:100%; padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border);',
        onInput: (e) => filterInventory(e.target.value)
      })
    )
  )


  // Create form section with all 4 fields (Horizontal layout)
  const createForm = el('div', { class: 'card inventory-form', style: 'margin-bottom:2rem;' },
    el('h3', { style: 'margin-top:0;' }, 'Add New Item'),
    el('div', { style: 'display:flex; gap:1rem; align-items:flex-end; flex-wrap:wrap;' },
      el('div', { class: 'form-row', style: 'flex:2; margin-bottom:0;' },
        el('label', { for: 'item-description', class: 'form-label' }, 'Item Description'),
        el('input', { id: 'item-description', placeholder: 'e.g., Cordless Drill', type: 'text', required: true })
      ),
      el('div', { class: 'form-row', style: 'flex:1; margin-bottom:0;' },
        el('label', { for: 'item-upc', class: 'form-label' }, 'UPC'),
        el('input', { id: 'item-upc', placeholder: 'e.g., 123456789012', type: 'number', required: true })
      ),
      el('div', { class: 'form-row', style: 'flex:1; margin-bottom:0;' },
        el('label', { for: 'item-number', class: 'form-label' }, 'Item Number'),
        el('input', {
          id: 'item-number',
          placeholder: 'e.g., 12345',
          type: 'text',
          required: true,
          value: String((data.inventory?.length || 0) + 1)
        })
      ),
      el('div', { class: 'form-row', style: 'flex:0.5; min-width:80px; margin-bottom:0;' },
        el('label', { for: 'item-quantity', class: 'form-label' }, 'Stock'),
        el('input', { id: 'item-quantity', placeholder: '5', type: 'number', min: '0', required: true })
      ),
      el('div', { class: 'form-row', style: 'flex:0.5; min-width:80px; margin-bottom:0;' },
        el('label', { for: 'item-target', class: 'form-label' }, 'Target'),
        el('input', { id: 'item-target', placeholder: '10', type: 'number', min: '0', required: true })
      ),
      el('button', { class: 'btn primary', style: 'height:45px; margin-bottom:2px; white-space:nowrap;', onClick: addItem }, '➕ Add Item')
    )
  )


  // Inventory list with table format
  const inventoryList = el('div', { class: 'inventory-list-section' },
    el('div', { class: 'section-header' },
      el('h2', {}, 'Your Items'),
      data.inventory && data.inventory.length > 0
        ? el('span', { class: 'badge' }, `${data.inventory.length} items`)
        : null
    ),
    data.inventory && data.inventory.length > 0
      ? el('div', { class: 'inventory-table-container' },
        el('table', { class: 'inventory-table', id: 'inventory-table' },
          el('thead', {},
            el('tr', {},
              el('th', {}, '#'),
              el('th', {}, 'Description'),
              el('th', {}, 'UPC'),
              el('th', {}, 'Number'),
              el('th', {}, 'Stock'),
              el('th', {}, 'Target'),
              el('th', {}, 'Need'),
              el('th', {}, 'Actions')
            )
          ),
          el('tbody', { id: 'inventory-tbody' },
            ...(data.inventory || []).map((item, idx) => renderInventoryRow(item, idx))
          )
        )
      )
      : el('div', { class: 'empty-state' },
        el('span', { class: 'empty-icon' }, '📋'),
        el('p', { class: 'muted' }, 'Your inventory is empty. Add your first item above!')
      )
  )

  // Other users' inventories section
  const otherInventoriesSection = el('div', { class: 'other-inventories-section', style: 'margin-top:3rem;' },
    el('div', { class: 'section-header' },
      el('h2', {}, 'Other Users\' Inventories'),
      el('p', { class: 'muted' }, 'View what other users have in stock for restocking coordination')
    ),
    el('div', { id: 'other-inventories-container' },
      el('div', { class: 'loading', style: 'text-align:center;padding:2rem;' }, 'Loading...')
    )
  )

  appEl.appendChild(header)
  appEl.appendChild(createForm)
  appEl.appendChild(inventoryList)

  // Add Recycling Bin section
  const recyclingBin = renderRecyclingBin()
  appEl.appendChild(recyclingBin)

  appEl.appendChild(otherInventoriesSection)

  // Load other users' inventories
  loadOtherInventories()

  // Setup Enter key navigation for the inventory form
  setupEnterKeyNavigation('.inventory-form', addItem)

  // Focus description field on load
  setTimeout(() => {
    const desc = document.getElementById('item-description')
    if (desc) desc.focus()
  }, 100)

  function renderInventoryRow(item, idx) {
    const need = Math.max(0, (item.target_quantity || 0) - (item.quantity || 0))
    const rowClass = need > 0 ? 'inventory-row restock-needed' : 'inventory-row'

    return el('tr', { class: rowClass, 'data-index': idx, 'data-search': `${item.description} ${item.upc} ${item.number}`.toLowerCase() },
      el('td', { class: 'item-number-col' }, `${idx + 1}`),
      el('td', { class: 'item-description' }, item.description || ''),
      el('td', { class: 'item-upc' }, item.upc || ''),
      el('td', { class: 'item-number' }, item.number || ''),
      el('td', { class: 'item-quantity-cell' },
        el('span', {
          class: 'quantity-value editable',
          title: 'Click to edit current stock',
          onClick: (e) => makeEditable(e.target, idx, 'quantity')
        }, String(item.quantity || 0))
      ),
      el('td', { class: 'item-target-cell' },
        el('span', {
          class: 'quantity-value target editable',
          style: 'background: var(--muted-light); color: var(--text);',
          title: 'Click to edit target stock',
          onClick: (e) => makeEditable(e.target, idx, 'target_quantity')
        }, String(item.target_quantity || 0))
      ),
      el('td', { class: 'item-need-cell' },
        need > 0
          ? el('span', { class: 'badge error', style: 'background: var(--error); color: white;' }, `+${need}`)
          : el('span', { class: 'badge success', style: 'background: var(--success); color: white;' }, '✓ OK')
      ),
      el('td', { class: 'item-actions' },
        el('button', { class: 'btn-remove', onClick: () => removeItem(idx) }, '×')
      )
    )
  }

  function makeEditable(span, idx, field) {
    const currentValue = data.inventory[idx][field]
    const input = el('input', {
      type: 'number',
      min: '0',
      value: currentValue,
      class: 'quantity-input',
      style: 'width:60px;padding:0.25rem;'
    })

    const saveField = async () => {
      const newValue = parseInt(input.value) || 0
      if (newValue !== currentValue) {
        data.inventory[idx][field] = newValue
        await auth.saveUserData({ name: user.name, email: user.email, inventory: data.inventory })
        showToast(`${field.replace('_', ' ')} updated`, 'success')

        // Manually update "Need" calculation and UI alerts
        const row = span.closest('tr')
        if (row) {
          const item = data.inventory[idx]
          const need = Math.max(0, (item.target_quantity || 0) - (item.quantity || 0))

          // Update the "Need" cell badge
          const needCell = row.querySelector('.item-need-cell')
          if (needCell) {
            needCell.innerHTML = ''
            const badge = need > 0
              ? el('span', { class: 'badge error', style: 'background: var(--error); color: white;' }, `+${need}`)
              : el('span', { class: 'badge success', style: 'background: var(--success); color: white;' }, '✓ OK')
            needCell.appendChild(badge)
          }

          // Update row class for restock highlighting
          if (need > 0) {
            row.classList.add('restock-needed')
          } else {
            row.classList.remove('restock-needed')
          }
        }
      }
      span.textContent = String(newValue)
      span.style.display = 'inline'
      input.remove()
      // Removed renderInventory(appEl) to prevent flickering
    }

    input.addEventListener('blur', saveField)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveField() }
      if (e.key === 'Escape') { span.style.display = 'inline'; input.remove() }
    })

    span.style.display = 'none'
    span.parentElement.appendChild(input)
    input.focus()
    input.select()
  }

  function filterInventory(query) {
    const q = (query || '').toLowerCase().trim()
    const rows = document.querySelectorAll('#inventory-tbody tr')
    rows.forEach(row => {
      const searchText = row.getAttribute('data-search') || ''
      row.style.display = searchText.includes(q) ? '' : 'none'
    })
  }


  async function addItem() {
    const description = document.getElementById('item-description').value.trim()
    const upc = document.getElementById('item-upc').value.trim()
    const number = document.getElementById('item-number').value.trim()
    const quantity = parseInt(document.getElementById('item-quantity').value) || 0
    const target = parseInt(document.getElementById('item-target').value) || 0

    if (!description) { showToast('Please enter item description', 'error'); return }
    if (!upc) { showToast('Please enter UPC', 'error'); return }
    if (!number) { showToast('Please enter item number', 'error'); return }
    if (quantity < 0) { showToast('Quantity must be 0 or greater', 'error'); return }

    data.inventory = data.inventory || []
    const newItem = {
      description,
      upc,
      number,
      quantity,
      target_quantity: target
    }
    data.inventory.push(newItem)
    await auth.saveUserData({ name: user.name, email: user.email, inventory: data.inventory })

    // Clear form
    document.getElementById('item-description').value = ''
    document.getElementById('item-upc').value = ''
    document.getElementById('item-number').value = String((data.inventory?.length || 0) + 1)
    document.getElementById('item-quantity').value = ''
    document.getElementById('item-target').value = ''
    document.getElementById('item-description').focus()

    showToast('Item added successfully', 'success')
    navigate('/inventory')
  }


  async function removeItem(idx) {
    const item = data.inventory[idx]
    data.deleted_inventory = data.deleted_inventory || []
    data.deleted_inventory.push(item)
    data.inventory.splice(idx, 1)
    await auth.saveUserData({
      name: user.name,
      email: user.email,
      inventory: data.inventory,
      deleted_inventory: data.deleted_inventory
    })
    showToast('Item moved to recycling bin', 'success')
    navigate('/inventory')
  }

  async function restoreItem(idx) {
    const item = data.deleted_inventory[idx]
    data.inventory = data.inventory || []
    data.inventory.push(item)
    data.deleted_inventory.splice(idx, 1)
    await auth.saveUserData({
      name: user.name,
      email: user.email,
      inventory: data.inventory,
      deleted_inventory: data.deleted_inventory
    })
    showToast('Item restored successfully', 'success')
    navigate('/inventory')
  }

  function renderRecyclingBin() {
    const hasItems = data.deleted_inventory && data.deleted_inventory.length > 0

    return el('div', { class: 'recycling-bin-section', style: 'margin-top:3rem; padding-top:2rem; border-top:1px dashed var(--border);' },
      el('div', { class: 'section-header', style: 'margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;' },
        el('span', { style: 'font-size:1.5rem;' }, '♻️'),
        el('h2', { style: 'margin:0;' }, 'Recycling Bin'),
        hasItems ? el('span', { class: 'badge muted' }, `${data.deleted_inventory.length} items`) : null
      ),
      el('p', { class: 'muted', style: 'margin-bottom:1.5rem;' },
        hasItems ? 'Items deleted from your inventory appear here. You can restore them anytime.' : 'Your recycling bin is empty.'
      ),
      hasItems ? el('div', { class: 'inventory-table-container', style: 'opacity:0.7;' },
        el('table', { class: 'inventory-table' },
          el('thead', {},
            el('tr', {},
              el('th', {}, 'Description'),
              el('th', {}, 'UPC'),
              el('th', {}, 'Number'),
              el('th', {}, 'Actions')
            )
          ),
          el('tbody', {},
            ...data.deleted_inventory.map((item, idx) => el('tr', {},
              el('td', {}, item.description || ''),
              el('td', {}, item.upc || ''),
              el('td', {}, item.number || ''),
              el('td', { class: 'item-actions' },
                el('button', { class: 'btn small primary', onClick: () => restoreItem(idx) }, 'Restore')
              )
            ))
          )
        )
      ) : null
    )
  }

  async function loadOtherInventories() {
    const container = document.getElementById('other-inventories-container')
    if (!container) return

    const inventories = await auth.getAllInventories()
    // Filter out current user
    const otherUsers = inventories.filter(u => u.email !== user.email)

    // Normalize each user's inventory
    otherUsers.forEach(userInv => {
      userInv.inventory = normalizeInventory(userInv.inventory)
    })


    container.innerHTML = ''

    if (otherUsers.length === 0) {
      container.appendChild(el('div', { class: 'empty-state' },
        el('span', { class: 'empty-icon' }, '👥'),
        el('p', { class: 'muted' }, 'No other users found')
      ))
      return
    }

    otherUsers.forEach(userInv => {
      const userCard = el('div', { class: 'card', style: 'margin-bottom:1.5rem;' },
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;' },
          el('div', {},
            el('h3', { style: 'margin:0;' }, userInv.name),
            el('p', { class: 'muted small', style: 'margin:0.25rem 0 0 0;' }, userInv.email)
          ),
          el('span', { class: 'badge' }, `${userInv.inventory?.length || 0} items`)
        ),
        userInv.inventory && userInv.inventory.length > 0
          ? el('div', { class: 'inventory-table-container' },
            el('table', { class: 'inventory-table' },
              el('thead', {},
                el('tr', {},
                  el('th', {}, 'Description'),
                  el('th', {}, 'UPC'),
                  el('th', {}, 'Number'),
                  el('th', {}, 'Stock'),
                  el('th', {}, 'Target'),
                  el('th', {}, 'Need')
                )
              ),
              el('tbody', {},
                ...userInv.inventory.map(item => {
                  const need = Math.max(0, (item.target_quantity || 0) - (item.quantity || 0))
                  return el('tr', { class: need > 0 ? 'restock-needed' : '' },
                    el('td', {}, item.description || ''),
                    el('td', {}, item.upc || ''),
                    el('td', {}, item.number || ''),
                    el('td', {}, String(item.quantity || 0)),
                    el('td', {}, String(item.target_quantity || 0)),
                    el('td', {}, need > 0
                      ? el('span', { style: 'color: var(--error); font-weight: bold;' }, `+${need}`)
                      : el('span', { style: 'color: var(--success);' }, 'OK')
                    )
                  )
                })
              )
            )
          )
          : el('p', { class: 'muted' }, 'No items in inventory')
      )
      container.appendChild(userCard)
    })
  }
}

export async function renderTraining(appEl) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''

  const header = el('div', { class: 'training-header' },
    el('div', { style: 'display:flex;justify-content:space-between;align-items:center;width:100%;' },
      el('div', {},
        el('h1', {}, 'Training Center'),
        el('p', { class: 'muted' }, 'Create and access interactive training modules and video resources')
      ),
      el('div', { class: 'cta-buttons' },
        el('button', { class: 'btn btn-large primary', onClick: () => navigate('/training/create') }, '➕ Create Training'),
        el('button', { class: 'btn btn-large', onClick: () => training.getTrainings().then(ts => { trainings = ts; navigate('/training') }) }, '🔄 Refresh')
      )
    )
  )

  // Load trainings
  let trainings = await training.getTrainings()

  if (trainings.length === 0) {
    const emptyState = el('div', { class: 'card', style: 'text-align:center;padding:3rem;' },
      el('div', { style: 'text-align:center; padding:2rem; background: var(--card-bg); border-radius:12px; border: 2px dashed var(--border);' },
        el('h3', { style: 'margin-bottom:1rem;' }, 'Ready to start?'),
        el('button', { class: 'btn btn-large primary', onClick: () => navigate('/training/create'), style: 'margin:0;' }, 'Create New Module')
      )
    )
    appEl.appendChild(header)
    appEl.appendChild(emptyState)
    return
  }

  const trainingsGrid = el('div', { class: 'trainings-grid' },
    ...trainings.map(t => el('div', { class: 'card training-item-card', onClick: () => navigate(`/training/view?id=${t.id}`), style: 'cursor:pointer;' },
      t.thumbnail_url ? el('img', { src: t.thumbnail_url, style: 'width:100%;max-height:250px;object-fit:cover;border-radius:12px 12px 0 0;margin:-1rem -1rem 1rem -1rem;display:block;' }) : null,
      el('div', { class: 'training-item-content', style: 'padding:0;' },
        el('h3', { style: 'margin:0 0 0.5rem 0;' }, t.title),
        el('p', { class: 'muted', style: 'margin:0 0 1rem 0;' }, t.description || 'No description'),
        el('div', { class: 'training-item-footer', style: 'display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid var(--border-light);margin-top:1rem;' },
          el('div', { style: 'display:flex;align-items:center;gap:0.5rem;' },
            // Placeholder for future profile image
            // el('img',{src:t.creator_profile_image, class:'profile-image-small', style:'width:24px;height:24px;border-radius:50%;object-fit:cover;'}),
            el('span', { class: 'muted small' }, `Created by ${t.created_by}`)
          ),
          t.created_by === user.email ? el('button', { class: 'btn-remove', onClick: (e) => { e.stopPropagation(); deleteAndRefresh(t.id); }, style: 'margin:0;' }, '×') : null
        )
      )
    ))
  )

  appEl.appendChild(header)
  appEl.appendChild(trainingsGrid)

  async function deleteTrainingItem(id) {
    const res = await training.deleteTraining(id, user.email)
    if (res.ok) {
      showToast('Training moved to recycling bin', 'success')
      navigate('/training')
    } else {
      showToast(res.error || 'Failed to delete', 'error')
    }
  }

  async function deleteAndRefresh(id) {
    if (!confirm('Are you sure you want to delete this training?')) return
    await training.deleteTraining(id, user.email)
    showToast('Training moved to recycling bin', 'success')
    navigate('/training')
  }

  // New helper for URL based routing
  window.viewTraining = async (id) => {
    const t = await training.getTraining(id)
    if (t) renderTrainingView(appEl, t)
    else showToast('Training not found', 'error')
  }
}

export async function renderTrainingViewByQuery(appEl) {
  const urlParams = new URLSearchParams(window.location.search)
  const id = urlParams.get('id')
  if (!id) { navigate('/training'); return }

  const t = await training.getTraining(id)
  if (t) renderTrainingView(appEl, t)
  else {
    showToast('Training not found', 'error')
    navigate('/training')
  }
}
export function renderCreateTraining(appEl) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''

  const form = el('div', { style: 'max-width:1000px;margin:0 auto;' },
    el('div', { class: 'section-header' },
      el('button', { class: 'btn', onClick: () => navigate('/training') }, '← Back'),
      el('h2', { style: 'margin:0; font-size:1.5rem;' }, 'Create New Training')
    ),
    el('div', { class: 'card', style: 'margin-bottom:1.5rem;' },
      el('div', { class: 'form-row' },
        el('label', { for: 'training-title', class: 'form-label' }, 'Training Title *'),
        el('input', { id: 'training-title', placeholder: 'Enter training title', type: 'text', required: true })
      ),
      el('div', { class: 'form-row' },
        el('label', { for: 'training-description', class: 'form-label' }, 'Description'),
        el('input', { id: 'training-description', placeholder: 'Brief description of the training', type: 'text' })
      ),
      el('div', { class: 'form-row' },
        el('label', { for: 'training-thumbnail', class: 'form-label' }, 'Thumbnail Image (Optional)'),
        el('input', { id: 'training-thumbnail', type: 'file', accept: 'image/*', onChange: handleThumbnailSelect }),
        el('p', { class: 'form-hint muted small' }, 'Upload a thumbnail image for the training (JPEG, PNG, GIF, or WebP)'),
        el('div', { id: 'thumbnail-preview', style: 'margin-top:1rem;display:none;' },
          el('img', { id: 'thumbnail-preview-element', style: 'width:100%;max-width:300px;max-height:200px;object-fit:cover;border-radius:8px;border:1px solid #ddd;' })
        )
      )
    ),
    el('div', { class: 'card' },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;' },
        el('h3', { style: 'margin:0;' }, 'Content Blocks'),
        el('div', { class: 'block-types', style: 'display:flex;gap:0.5rem;flex-wrap:wrap;' },
          el('button', { class: 'btn btn-small', onClick: () => addBlock('title') }, '📝 Title'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('text') }, '📄 Text'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('video') }, '🎥 Video'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('image') }, '🖼️ Image'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('code') }, '💻 Code'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('list') }, '📋 List'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('quote') }, '💬 Quote'),
          el('button', { class: 'btn btn-small', onClick: () => addBlock('divider') }, '➖ Divider')
        )
      ),
      el('div', { id: 'blocks-container', style: 'min-height:200px;' })
    ),
    el('div', { class: 'actions', style: 'margin-top:2rem;' },
      el('button', { class: 'btn btn-large primary', onClick: onSubmit }, 'Create Training'),
      el('button', { class: 'btn btn-large', onClick: () => navigate('/training') }, 'Cancel')
    )
  )

  appEl.appendChild(form)

  let selectedThumbnailFile = null
  let thumbnailUrl = null
  let blocks = []
  let blockCounter = 0
  let draggedElement = null
  let draggedIndex = null

  function handleThumbnailSelect(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image file too large (max 10MB)', 'error')
        e.target.value = ''
        return
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
        showToast('Please upload a valid image (JPEG, PNG, GIF, or WebP)', 'error')
        e.target.value = ''
        return
      }
      selectedThumbnailFile = file
      const preview = document.getElementById('thumbnail-preview')
      const previewEl = document.getElementById('thumbnail-preview-element')
      if (preview && previewEl) {
        preview.style.display = 'block'
        previewEl.src = URL.createObjectURL(file)
      }
    }
  }

  function addBlock(type) {
    const blockId = `block-${blockCounter++}`
    const block = {
      id: blockId,
      type: type,
      order: blocks.length,
      content: getDefaultContent(type)
    }
    blocks.push(block)
    renderBlocks()
  }

  function getDefaultContent(type) {
    switch (type) {
      case 'title': return { text: '', level: 'h2' }
      case 'text': return { text: '' }
      case 'video': return { url: '', file: null }
      case 'image': return { url: '', file: null, alt: '' }
      case 'code': return { code: '', language: 'javascript' }
      case 'list': return { items: [''], ordered: false }
      case 'quote': return { text: '', author: '' }
      case 'divider': return {}
      default: return {}
    }
  }

  function removeBlock(blockId) {
    blocks = blocks.filter(b => b.id !== blockId)
    blocks.forEach((b, idx) => { b.order = idx })
    renderBlocks()
  }

  function updateBlock(blockId, field, value) {
    const block = blocks.find(b => b.id === blockId)
    if (block) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        if (!block.content[parent]) block.content[parent] = {}
        block.content[parent][child] = value
      } else {
        block.content[field] = value
      }
    }
  }

  function handleDragStart(e, index) {
    draggedElement = e.currentTarget
    draggedIndex = index
    e.currentTarget.style.opacity = '0.5'
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const afterElement = getDragAfterElement(e.currentTarget, e.clientY)
    const container = document.getElementById('blocks-container')
    if (afterElement == null) {
      container.appendChild(draggedElement)
    } else {
      container.insertBefore(draggedElement, afterElement)
    }
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1'
    const newIndex = Array.from(document.getElementById('blocks-container').children).indexOf(draggedElement)
    if (newIndex !== draggedIndex) {
      const temp = blocks[draggedIndex]
      blocks[draggedIndex] = blocks[newIndex]
      blocks[newIndex] = temp
      blocks.forEach((b, idx) => { b.order = idx })
      renderBlocks()
    }
    draggedElement = null
    draggedIndex = null
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.block-item:not(.dragging)')]
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child }
      } else {
        return closest
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element
  }

  function renderBlocks() {
    const container = document.getElementById('blocks-container')
    if (!container) return

    container.innerHTML = ''

    if (blocks.length === 0) {
      container.appendChild(el('div', { class: 'empty-state', style: 'text-align:center;padding:3rem;' },
        el('p', { class: 'muted' }, 'No content blocks yet. Click the buttons above to add blocks.')
      ))
      return
    }

    blocks.sort((a, b) => a.order - b.order).forEach((block, idx) => {
      const blockEl = renderBlock(block, idx)
      container.appendChild(blockEl)
    })
  }

  function renderBlock(block, idx) {
    const blockEl = el('div', {
      class: 'block-item',
      draggable: true,
      onDragStart: (e) => handleDragStart(e, idx),
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      style: 'margin-bottom:1rem;padding:1rem;background:#f8fafc;border-radius:8px;border:2px dashed #e2e8f0;cursor:move;position:relative;'
    },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;' },
        el('div', { style: 'display:flex;align-items:center;gap:0.5rem;' },
          el('span', { style: 'font-size:1.2rem;' }, getBlockIcon(block.type)),
          el('span', { style: 'font-weight:600;text-transform:capitalize;' }, block.type)
        ),
        el('button', { class: 'btn-remove', onClick: () => removeBlock(block.id), style: 'margin:0;width:28px;height:28px;font-size:1.2rem;' }, '×')
      ),
      renderBlockContent(block)
    )
    return blockEl
  }

  function getBlockIcon(type) {
    const icons = {
      title: '📝',
      text: '📄',
      video: '🎥',
      image: '🖼️',
      code: '💻',
      list: '📋',
      quote: '💬',
      divider: '➖'
    }
    return icons[type] || '📦'
  }

  function renderBlockContent(block) {
    switch (block.type) {
      case 'title':
        return el('div', {},
          el('select', {
            value: block.content.level || 'h2',
            onChange: (e) => updateBlock(block.id, 'content.level', e.target.value),
            style: 'width:100px;margin-bottom:0.5rem;padding:0.5rem;border-radius:4px;border:1px solid #e2e8f0;'
          },
            el('option', { value: 'h1' }, 'H1'),
            el('option', { value: 'h2' }, 'H2'),
            el('option', { value: 'h3' }, 'H3'),
            el('option', { value: 'h4' }, 'H4')
          ),
          el('input', {
            type: 'text',
            placeholder: 'Enter title text',
            value: block.content.text || '',
            onInput: (e) => updateBlock(block.id, 'content.text', e.target.value),
            style: 'width:100%;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;font-size:1.1rem;'
          })
        )
      case 'text':
        return el('textarea', {
          placeholder: 'Enter text content',
          rows: 6,
          value: block.content.text || '',
          onInput: (e) => updateBlock(block.id, 'content.text', e.target.value),
          style: 'width:100%;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;resize:vertical;font-family:inherit;'
        })
      case 'video':
        return el('div', {},
          el('input', {
            type: 'file',
            accept: 'video/*',
            onChange: async (e) => {
              const file = e.target.files[0]
              if (file) {
                if (file.size > 50 * 1024 * 1024) {
                  showToast('Video file too large (max 50MB)', 'error')
                  return
                }
                updateBlock(block.id, 'content.file', file)
                showToast('Video will be uploaded when you create the training', 'success')
              }
            },
            style: 'width:100%;margin-bottom:0.5rem;'
          }),
          el('input', {
            type: 'text',
            placeholder: 'Or enter video URL',
            value: block.content.url || '',
            onInput: (e) => updateBlock(block.id, 'content.url', e.target.value),
            style: 'width:100%;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;'
          })
        )
      case 'image':
        return el('div', {},
          el('input', {
            type: 'file',
            accept: 'image/*',
            onChange: async (e) => {
              const file = e.target.files[0]
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  showToast('Image file too large (max 10MB)', 'error')
                  return
                }
                updateBlock(block.id, 'content.file', file)
                const preview = URL.createObjectURL(file)
                const previewEl = document.getElementById(`image-preview-${block.id}`)
                if (previewEl) {
                  previewEl.src = preview
                  previewEl.style.display = 'block'
                }
              }
            },
            style: 'width:100%;margin-bottom:0.5rem;'
          }),
          el('img', {
            id: `image-preview-${block.id}`,
            style: 'width:100%;max-height:300px;object-fit:cover;border-radius:4px;margin-bottom:0.5rem;display:none;'
          }),
          el('input', {
            type: 'text',
            placeholder: 'Or enter image URL',
            value: block.content.url || '',
            onInput: (e) => updateBlock(block.id, 'content.url', e.target.value),
            style: 'width:100%;margin-bottom:0.5rem;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;'
          }),
          el('input', {
            type: 'text',
            placeholder: 'Alt text (optional)',
            value: block.content.alt || '',
            onInput: (e) => updateBlock(block.id, 'content.alt', e.target.value),
            style: 'width:100%;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;'
          })
        )
      case 'code':
        return el('div', {},
          el('input', {
            type: 'text',
            placeholder: 'Language (e.g., javascript, python, html)',
            value: block.content.language || 'javascript',
            onInput: (e) => updateBlock(block.id, 'content.language', e.target.value),
            style: 'width:100%;margin-bottom:0.5rem;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;'
          }),
          el('textarea', {
            placeholder: 'Enter code',
            rows: 8,
            value: block.content.code || '',
            onInput: (e) => updateBlock(block.id, 'content.code', e.target.value),
            style: 'width:100%;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;resize:vertical;font-family:monospace;font-size:0.9rem;'
          })
        )
      case 'list':
        return el('div', {},
          el('div', { style: 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;' },
            el('label', { style: 'display:flex;align-items:center;gap:0.5rem;cursor:pointer;' },
              el('input', {
                type: 'checkbox',
                checked: block.content.ordered || false,
                onChange: (e) => updateBlock(block.id, 'content.ordered', e.target.checked)
              }),
              el('span', {}, 'Ordered list')
            )
          ),
          el('div', { id: `list-items-${block.id}` },
            ...(block.content.items || ['']).map((item, itemIdx) =>
              el('div', { style: 'display:flex;gap:0.5rem;margin-bottom:0.5rem;' },
                el('input', {
                  type: 'text',
                  placeholder: `Item ${itemIdx + 1}`,
                  value: item,
                  onInput: (e) => {
                    const items = [...(block.content.items || [])]
                    items[itemIdx] = e.target.value
                    updateBlock(block.id, 'content.items', items)
                  },
                  style: 'flex:1;padding:0.5rem;border-radius:4px;border:1px solid #e2e8f0;'
                }),
                el('button', {
                  class: 'btn btn-small',
                  onClick: () => {
                    const items = [...(block.content.items || [])]
                    items.splice(itemIdx, 1)
                    updateBlock(block.id, 'content.items', items)
                    renderBlocks()
                  }
                }, '×')
              )
            )
          ),
          el('button', {
            class: 'btn btn-small',
            onClick: () => {
              const items = [...(block.content.items || [])]
              items.push('')
              updateBlock(block.id, 'content.items', items)
              renderBlocks()
            }
          }, '+ Add Item')
        )
      case 'quote':
        return el('div', {},
          el('textarea', {
            placeholder: 'Quote text',
            rows: 4,
            value: block.content.text || '',
            onInput: (e) => updateBlock(block.id, 'content.text', e.target.value),
            style: 'width:100%;margin-bottom:0.5rem;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;resize:vertical;font-family:inherit;'
          }),
          el('input', {
            type: 'text',
            placeholder: 'Author (optional)',
            value: block.content.author || '',
            onInput: (e) => updateBlock(block.id, 'content.author', e.target.value),
            style: 'width:100%;padding:0.75rem;border-radius:4px;border:1px solid #e2e8f0;'
          })
        )
      case 'divider':
        return el('div', { style: 'text-align:center;padding:1rem;' },
          el('hr', { style: 'border:none;border-top:2px dashed #cbd5e1;' })
        )
      default:
        return el('div', { class: 'muted' }, 'Unknown block type')
    }
  }

  async function onSubmit() {
    const title = document.getElementById('training-title').value.trim()
    const description = document.getElementById('training-description').value.trim()

    if (!title) {
      showToast('Title is required', 'error')
      return
    }

    // Upload thumbnail if selected
    if (selectedThumbnailFile) {
      showToast('Uploading thumbnail...', 'success')
      const uploadRes = await training.uploadImage(selectedThumbnailFile, user.email)
      if (uploadRes.ok) {
        thumbnailUrl = uploadRes.image_url
      } else {
        showToast(uploadRes.error || 'Failed to upload thumbnail', 'error')
        return
      }
    }

    // Upload files for blocks
    showToast('Uploading files...', 'success')
    const processedBlocks = []
    for (const block of blocks) {
      const processedBlock = { ...block }
      if (block.type === 'video' && block.content.file) {
        const uploadRes = await training.uploadVideo(block.content.file, user.email)
        if (uploadRes.ok) {
          processedBlock.content.url = uploadRes.video_url
          delete processedBlock.content.file
        } else {
          showToast(`Failed to upload video: ${uploadRes.error}`, 'error')
          return
        }
      } else if (block.type === 'image' && block.content.file) {
        const uploadRes = await training.uploadImage(block.content.file, user.email)
        if (uploadRes.ok) {
          processedBlock.content.url = uploadRes.image_url
          delete processedBlock.content.file
        } else {
          showToast(`Failed to upload image: ${uploadRes.error}`, 'error')
          return
        }
      }
      processedBlocks.push(processedBlock)
    }

    // Create training
    const res = await training.createTraining(user.email, {
      title,
      description,
      thumbnail_url: thumbnailUrl,
      blocks: processedBlocks.map((b, idx) => ({
        id: b.id,
        type: b.type,
        order: idx,
        content: b.content
      }))
    })

    if (res.ok) {
      showToast('Training created successfully!', 'success')
      navigate('/training')
    } else {
      showToast(res.error || 'Failed to create training', 'error')
    }
  }

  // Initial render
  renderBlocks()
}

export function renderTrainingView(appEl, trainingData) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''

  const header = el('div', { class: 'training-view-header' },
    el('button', { class: 'btn', onClick: () => navigate('/training') }, '← Back to Trainings'),
    trainingData.thumbnail_url ? el('img', { src: trainingData.thumbnail_url, style: 'width:100%;max-width:600px;max-height:300px;object-fit:cover;border-radius:12px;margin-bottom:1.5rem;' }) : null,
    el('h1', {}, trainingData.title),
    el('p', { class: 'muted' }, trainingData.description || '')
  )

  // Render blocks if available, otherwise fallback to old format
  let content
  if (trainingData.blocks && trainingData.blocks.length > 0) {
    content = el('div', { class: 'training-view-content' },
      ...trainingData.blocks.sort((a, b) => (a.order || 0) - (b.order || 0)).map(block => renderBlockView(block))
    )
  } else {
    // Fallback for old format
    content = el('div', { class: 'card training-view-content' },
      trainingData.video_url ? el('div', { class: 'training-video-full', style: 'margin-bottom:2rem;' },
        el('h3', {}, 'Video'),
        el('video', { src: trainingData.video_url, controls: true, style: 'width:100%;max-height:500px;border-radius:12px;margin-top:1rem;' })
      ) : null,
      trainingData.content ? el('div', { class: 'training-text-full', style: 'margin-bottom:2rem;' },
        el('h3', {}, 'Content'),
        el('div', { style: 'white-space:pre-wrap;line-height:1.8;margin-top:1rem;padding:1.5rem;background:#f8fafc;border-radius:12px;' },
          trainingData.content
        )
      ) : null,
      (!trainingData.video_url && !trainingData.content) ? el('div', { class: 'empty-state' },
        el('p', { class: 'muted' }, 'No content available for this training')
      ) : null
    )
  }

  appEl.appendChild(header)
  appEl.appendChild(content)
}

function renderBlockView(block) {
  switch (block.type) {
    case 'title':
      const level = block.content?.level || 'h2'
      const titleText = block.content?.text || ''
      const titleEl = document.createElement(level)
      titleEl.textContent = titleText
      titleEl.style.margin = '2rem 0 1rem 0'
      return titleEl
    case 'text':
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;padding:1.5rem;' },
        el('div', { style: 'white-space:pre-wrap;line-height:1.8;' }, block.content?.text || '')
      )
    case 'video':
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;' },
        el('video', {
          src: block.content?.url || '',
          controls: true,
          style: 'width:100%;max-height:500px;border-radius:12px;display:block;'
        })
      )
    case 'image':
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;padding:0;overflow:hidden;' },
        el('img', {
          src: block.content?.url || '',
          alt: block.content?.alt || '',
          style: 'width:100%;max-height:500px;object-fit:cover;display:block;'
        })
      )
    case 'code':
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;padding:1.5rem;background:#1e293b;color:#e2e8f0;' },
        el('div', { style: 'margin-bottom:0.5rem;font-size:0.875rem;color:#94a3b8;text-transform:uppercase;' }, block.content?.language || 'code'),
        el('pre', { style: 'margin:0;overflow-x:auto;' },
          el('code', { style: 'font-family:monospace;font-size:0.9rem;line-height:1.6;' }, block.content?.code || '')
        )
      )
    case 'list':
      const items = block.content?.items || []
      const ListTag = block.content?.ordered ? 'ol' : 'ul'
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;padding:1.5rem;' },
        el(ListTag, { style: 'margin:0;padding-left:1.5rem;line-height:1.8;' },
          ...items.filter(item => item.trim()).map(item => el('li', {}, item))
        )
      )
    case 'quote':
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;padding:1.5rem;border-left:4px solid #2563eb;background:#f8fafc;' },
        el('blockquote', { style: 'margin:0;font-style:italic;line-height:1.8;font-size:1.1rem;' }, block.content?.text || ''),
        block.content?.author ? el('div', { style: 'margin-top:1rem;text-align:right;color:#64748b;' }, `— ${block.content.author}`) : null
      )
    case 'divider':
      return el('div', { style: 'margin:2rem 0;text-align:center;' },
        el('hr', { style: 'border:none;border-top:2px dashed #cbd5e1;' })
      )
    default:
      return el('div', { class: 'card', style: 'margin-bottom:1.5rem;padding:1.5rem;' }, 'Unknown block type')
  }
}

export async function renderRecyclingBin(appEl) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''

  const header = el('div', { class: 'training-header' },
    el('div', { style: 'display:flex;justify-content:space-between;align-items:center;width:100%;' },
      el('div', {},
        el('h1', {}, '🗑️ Recycling Bin'),
        el('p', { class: 'muted' }, 'Restore or permanently delete your deleted items')
      )
    )
  )

  // Load deleted trainings and inventory
  const deletedTrainings = await training.getDeletedTrainings(user.email)
  const userData = await auth.getUserData(user.email) || {}
  const deletedInventory = userData.deleted_inventory || []

  const hasItems = deletedTrainings.length > 0 || deletedInventory.length > 0

  if (!hasItems) {
    const emptyState = el('div', { class: 'card', style: 'text-align:center;padding:3rem;' },
      el('span', { style: 'font-size:4rem;display:block;margin-bottom:1rem;' }, '🗑️'),
      el('h2', {}, 'Recycling Bin is Empty'),
      el('p', { class: 'muted' }, 'Deleted items will appear here')
    )
    appEl.appendChild(header)
    appEl.appendChild(emptyState)
    return
  }

  const content = el('div', {})

  // Deleted Trainings Section
  if (deletedTrainings.length > 0) {
    const trainingsSection = el('div', { style: 'margin-bottom:2rem;' },
      el('h2', { style: 'margin-bottom:1rem;' }, 'Deleted Trainings'),
      el('div', { class: 'trainings-grid' },
        ...deletedTrainings.map(t => el('div', { class: 'card training-item-card', style: 'opacity:0.8;' },
          t.thumbnail_url ? el('img', { src: t.thumbnail_url, style: 'width:100%;max-height:250px;object-fit:cover;border-radius:12px 12px 0 0;margin:-1rem -1rem 1rem -1rem;display:block;' }) : null,
          el('div', { class: 'training-item-content', style: 'padding:0;' },
            el('h3', { style: 'margin:0 0 0.5rem 0;' }, t.title),
            el('p', { class: 'muted', style: 'margin:0 0 1rem 0;' }, t.description || 'No description'),
            el('div', { style: 'margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-light);display:flex;gap:0.5rem;' },
              el('button', { class: 'btn primary', onClick: () => restoreTrainingItem(t.id) }, '↩️ Restore'),
              el('button', { class: 'btn', style: 'background:var(--error);color:#fff;', onClick: () => permanentDeleteTrainingItem(t.id) }, '🗑️ Delete Permanently')
            )
          )
        ))
      )
    )
    content.appendChild(trainingsSection)
  }

  // Deleted Inventory Section
  if (deletedInventory.length > 0) {
    const inventorySection = el('div', {},
      el('h2', { style: 'margin-bottom:1rem;' }, 'Deleted Inventory Items'),
      el('ul', { class: 'list inventory-list' },
        ...deletedInventory.map((item, idx) => el('li', { class: 'inventory-item-full' },
          el('span', { class: 'item-number' }, `${idx + 1}.`),
          el('span', { class: 'item-icon' }, '📦'),
          el('span', { class: 'item-name' }, item),
          el('div', { style: 'margin-left:auto;display:flex;gap:0.5rem;' },
            el('button', { class: 'btn btn-small primary', onClick: () => restoreInventoryItem(idx) }, '↩️ Restore'),
            el('button', { class: 'btn btn-small', style: 'background:var(--error);color:#fff;', onClick: () => permanentDeleteInventoryItem(idx) }, '🗑️ Delete')
          )
        ))
      )
    )
    content.appendChild(inventorySection)
  }

  appEl.appendChild(header)
  appEl.appendChild(content)

  async function restoreTrainingItem(id) {
    const res = await training.restoreTraining(id, user.email)
    if (res.ok) {
      showToast('Training restored', 'success')
      navigate('/recycling-bin')
    } else {
      showToast(res.error || 'Failed to restore', 'error')
    }
  }

  async function permanentDeleteTrainingItem(id) {
    if (!confirm('Are you sure you want to permanently delete this training? This action cannot be undone.')) return
    const res = await training.permanentDeleteTraining(id, user.email)
    if (res.ok) {
      showToast('Training permanently deleted', 'success')
      navigate('/recycling-bin')
    } else {
      showToast(res.error || 'Failed to delete', 'error')
    }
  }

  async function restoreInventoryItem(idx) {
    const item = deletedInventory[idx]
    const userData = await auth.getUserData(user.email) || { inventory: [], deleted_inventory: [] }
    userData.inventory = userData.inventory || []
    userData.deleted_inventory = userData.deleted_inventory || []

    // Move back to inventory
    userData.inventory.push(item)
    userData.deleted_inventory.splice(idx, 1)

    const res = await auth.saveUserData({
      name: user.name,
      email: user.email,
      inventory: userData.inventory,
      deleted_inventory: userData.deleted_inventory
    })

    if (res.ok) {
      showToast('Item restored', 'success')
      navigate('/recycling-bin')
    } else {
      showToast(res.error || 'Failed to restore', 'error')
    }
  }

  async function permanentDeleteInventoryItem(idx) {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return
    const userData = await auth.getUserData(user.email) || { deleted_inventory: [] }
    userData.deleted_inventory = userData.deleted_inventory || []
    userData.deleted_inventory.splice(idx, 1)

    const res = await auth.saveUserData({
      name: user.name,
      email: user.email,
      inventory: userData.inventory || [],
      deleted_inventory: userData.deleted_inventory
    })

    if (res.ok) {
      showToast('Item permanently deleted', 'success')
      navigate('/recycling-bin')
    } else {
      showToast(res.error || 'Failed to delete', 'error')
    }
  }
}

export function renderTrainingModules(appEl) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''

  const header = el('div', { class: 'modules-header' },
    el('h1', {}, 'Training Modules'),
    el('p', { class: 'muted' }, 'Complete these modules to build your knowledge and skills')
  )

  const modules = [
    { title: 'Module 1: Fundamentals', desc: 'Learn the basics and core concepts', duration: '30 min', status: 'available' },
    { title: 'Module 2: Intermediate Skills', desc: 'Build on your foundation with advanced techniques', duration: '45 min', status: 'available' },
    { title: 'Module 3: Advanced Techniques', desc: 'Master complex scenarios and expert-level practices', duration: '60 min', status: 'available' }
  ]

  const modulesList = el('div', { class: 'modules-list' },
    ...modules.map(m => el('div', { class: 'card module-card' },
      el('div', { class: 'module-header' },
        el('div', { class: 'module-icon' }, '📚'),
        el('div', { class: 'module-info' },
          el('h3', {}, m.title),
          el('p', { class: 'muted' }, m.desc)
        )
      ),
      el('div', { class: 'module-footer' },
        el('span', { class: 'module-duration' }, `⏱ ${m.duration}`),
        el('button', { class: 'btn primary', onClick: () => showToast(`Starting ${m.title}...`, 'success') }, 'Start Module')
      )
    ))
  )

  appEl.appendChild(header)
  appEl.appendChild(modulesList)
}

export function renderVideos(appEl) {
  const user = auth.getCurrentUser()
  if (!user) { navigate('/login'); return }
  appEl.innerHTML = ''

  const header = el('div', { class: 'videos-header' },
    el('h1', {}, 'Video Resources'),
    el('p', { class: 'muted' }, 'Watch expert-led tutorials and learn at your own pace')
  )

  const videos = [
    { title: 'How to use Train Hub', desc: 'Get started with Train Hub and learn the basics', duration: '15 min', thumbnail: '🎥' },
    { title: 'Effective Training Techniques', desc: 'Master proven methods for effective training', duration: '25 min', thumbnail: '🎓' },
    { title: 'Safety and Best Practices', desc: 'Learn essential safety protocols and industry best practices', duration: '20 min', thumbnail: '🛡️' }
  ]

  const videosGrid = el('div', { class: 'videos-grid' },
    ...videos.map(v => el('div', { class: 'card video-card' },
      el('div', { class: 'video-thumbnail' }, v.thumbnail),
      el('div', { class: 'video-content' },
        el('h3', {}, v.title),
        el('p', { class: 'muted' }, v.desc),
        el('div', { class: 'video-meta' },
          el('span', { class: 'video-duration' }, `⏱ ${v.duration}`)
        ),
        el('button', { class: 'btn primary', onClick: (e) => { e.preventDefault(); showToast(`Playing: ${v.title}`, 'success') } }, 'Watch Video')
      )
    ))
  )

  appEl.appendChild(header)
  appEl.appendChild(videosGrid)
}
