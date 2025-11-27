import * as auth from './auth.js'
import * as training from './training.js'

function el(tag, attrs={}, ...children){
  const e = document.createElement(tag)
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') e.className = v
    else if(k==='style' && typeof v === 'string') e.style.cssText = v
    else if(k.startsWith('on')) {
      // allow attributes like onClick or onclick -> register proper event
      const ev = k.slice(2).toLowerCase()
      e.addEventListener(ev, v)
    } else if(v !== null && v !== undefined) e.setAttribute(k,v)
  })
  children.flat().forEach(c=>{ if(c==null) return; if(typeof c==='string') e.appendChild(document.createTextNode(c)); else e.appendChild(c) })
  return e
}

function showToast(message, type='error', timeout=3500){
  let container = document.querySelector('.toast-container')
  if(!container){
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  const t = document.createElement('div')
  t.className = 'toast ' + (type || '')
  t.textContent = message
  container.appendChild(t)
  setTimeout(()=>{ t.remove() }, timeout)
}

export function renderHome(appEl){
  const user = auth.getCurrentUser()
  if(!user){ 
    // Show login/signup when not logged in
    const hero = el('div',{class:'hero-section'},
      el('h1',{class:'hero-title'},'Welcome to Train Hub'),
      el('p',{class:'hero-subtitle'},'Your comprehensive platform for inventory management and professional training.'),
      el('div',{class:'hero-features'},
        el('div',{class:'feature-item'},
          el('span',{class:'feature-icon'},'📦'),
          el('div',{class:'feature-content'},
            el('h3',{},'Inventory Management'),
            el('p',{class:'muted'},'Organize and track your items efficiently')
          )
        ),
        el('div',{class:'feature-item'},
          el('span',{class:'feature-icon'},'🎓'),
          el('div',{class:'feature-content'},
            el('h3',{},'Training Modules'),
            el('p',{class:'muted'},'Access interactive training materials')
          )
        ),
        el('div',{class:'feature-item'},
          el('span',{class:'feature-icon'},'🎥'),
          el('div',{class:'feature-content'},
            el('h3',{},'Video Resources'),
            el('p',{class:'muted'},'Learn from expert video tutorials')
          )
        )
      )
    )
    
    const ctaCard = el('div',{class:'card cta-card'},
      el('h2',{},'Get Started Today'),
      el('p',{class:'muted'},'Create your free account to start managing your inventory and accessing training resources.'),
      el('div',{class:'cta-buttons'},
        el('button',{class:'btn btn-large primary', onClick:()=> location.hash = '#/signup'},'Create Account'),
        el('button',{class:'btn btn-large', onClick:()=> location.hash = '#/login'},'Sign In')
      )
    )
    
    appEl.appendChild(hero)
    appEl.appendChild(ctaCard)
    return
  }
  
  // Show training page content when logged in
  renderTraining(appEl)
}

export function renderLogin(appEl){
  appEl.innerHTML = ''
  const form = el('div',{class:'card login-card'},
    el('div',{class:'login-header'},
      el('h2',{},'Welcome Back'),
      el('p',{class:'muted'},'Sign in to your account to continue')
    ),
    el('div',{class:'form-row'},
      el('label',{for:'email',class:'form-label'},'Email Address'),
      el('input',{id:'email',placeholder:'you@example.com',type:'email',autocomplete:'email'})
    ),
    el('div',{class:'form-row'},
      el('label',{for:'password',class:'form-label'},'Password'),
      el('input',{id:'password',placeholder:'Enter your password',type:'password',autocomplete:'current-password'})
    ),
    el('div',{class:'actions'},
      el('button',{class:'btn btn-large primary', onClick: onLogin},'Sign In'),
      el('button',{class:'btn btn-large', onClick:()=> location.hash = '#/signup'},'Create Account')
    ),
    el('div',{class:'login-footer'},
      el('p',{class:'muted small'},'Don\'t have an account? '),
      el('a',{href:'#/signup',class:'link'},'Sign up here')
    ),
    el('div',{id:'login-error',class:'muted small'})
  )
  appEl.appendChild(form)

  async function onLogin(){
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    if(!email){ showToast('Please enter your email', 'error'); return }
    if(!password){ showToast('Please enter your password', 'error'); return }
    const res = await auth.login(email,password)
    if(!res.ok){ showToast(res.error || 'Login failed', 'error'); return }
    showToast('Signed in successfully', 'success')
    location.hash = '#/'
  }
}

export function renderSignup(appEl){
  appEl.innerHTML = ''
  const form = el('div',{class:'card signup-card'},
    el('div',{class:'signup-header'},
      el('h2',{},'Create Your Account'),
      el('p',{class:'muted'},'Join Train Hub and start managing your inventory today')
    ),
    el('div',{class:'form-row'},
      el('label',{for:'name',class:'form-label'},'Full Name'),
      el('input',{id:'name',placeholder:'John Doe',type:'text',autocomplete:'name'})
    ),
    el('div',{class:'form-row'},
      el('label',{for:'email',class:'form-label'},'Email Address'),
      el('input',{id:'email',placeholder:'you@example.com',type:'email',autocomplete:'email'})
    ),
    el('div',{class:'form-row'},
      el('label',{for:'password',class:'form-label'},'Password'),
      el('input',{id:'password',placeholder:'Minimum 6 characters',type:'password',autocomplete:'new-password'}),
      el('p',{class:'form-hint muted small'},'Password must be at least 6 characters long')
    ),
    el('div',{class:'form-row'},
      el('label',{for:'password-confirm',class:'form-label'},'Confirm Password'),
      el('input',{id:'password-confirm',placeholder:'Re-enter your password',type:'password',autocomplete:'new-password'})
    ),
    el('div',{class:'actions'},
      el('button',{class:'btn btn-large primary', onClick: onSignup},'Create Account'),
      el('button',{class:'btn btn-large', onClick:()=> location.hash = '#/login'},'Sign In Instead')
    ),
    el('div',{class:'signup-footer'},
      el('p',{class:'muted small'},'Already have an account? '),
      el('a',{href:'#/login',class:'link'},'Sign in here')
    ),
    el('div',{id:'signup-error',class:'muted small'})
  )
  appEl.appendChild(form)

  async function onSignup(){
    const name = document.getElementById('name').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    // basic client-side validation
    if(!name){ showToast('Name is required', 'error'); return }
    if(!email){ showToast('Email is required', 'error'); return }
    if(!password || password.length < 6){ showToast('Password must be at least 6 characters', 'error'); return }
    if(password !== passwordConfirm){ showToast('Passwords do not match', 'error'); return }
    const res = await auth.signup({name,email,password})
    if(!res.ok){ showToast(res.error || 'Signup failed', 'error'); return }
    showToast('Account created successfully!', 'success')
    location.hash = '#/'
  }
}

export async function renderInventory(appEl){
  const user = auth.getCurrentUser()
  if(!user){ location.hash = '#/login'; return }
  appEl.innerHTML = ''
  const data = (await auth.getUserData(user.email)) || {inventory:[]}

  const header = el('div',{class:'inventory-header'},
    el('div',{},
      el('h1',{},'Your Inventory'),
      el('p',{class:'muted'},`You have ${data.inventory?.length || 0} item${data.inventory?.length !== 1 ? 's' : ''} in your inventory`)
    )
  )

  const left = el('div',{class:'inventory-list-section'},
    el('div',{class:'section-header'},
      el('h2',{},'Items'),
      data.inventory && data.inventory.length > 0 
        ? el('span',{class:'badge'},`${data.inventory.length} items`)
        : null
    ),
    data.inventory && data.inventory.length > 0
      ? el('ul',{class:'list inventory-list', id:'inventory-list'}, 
          ...(data.inventory||[]).map((it, idx) => el('li',{class:'inventory-item-full'},
            el('span',{class:'item-number'},`${idx + 1}.`),
            el('span',{class:'item-icon'},'📦'),
            el('span',{class:'item-name'}, it),
            el('button',{class:'btn-remove', onClick:()=> removeItem(idx)},'×')
          ))
        )
      : el('div',{class:'empty-state'},
          el('span',{class:'empty-icon'},'📋'),
          el('p',{class:'muted'},'Your inventory is empty. Add your first item below!')
        )
  )

  const right = el('div',{class:'add-item-section'},
    el('div',{class:'card'},
      el('h3',{},'Add New Item'),
      el('p',{class:'muted small'},'Enter the name of the item you want to add to your inventory'),
      el('div',{class:'form-row'}, 
        el('input',{id:'new-item',placeholder:'e.g., Laptop, Training Manual, etc.',type:'text'})
      ),
      el('div',{class:'actions'}, 
        el('button',{class:'btn btn-large primary', onClick:addItem},'Add Item')
      )
    )
  )

  const container = el('div',{class:'two-cols'}, left, right)
  appEl.appendChild(header)
  appEl.appendChild(container)

  async function addItem(){
    const v = document.getElementById('new-item').value.trim()
    if(!v){ showToast('Please enter an item name', 'error'); return }
    data.inventory = data.inventory || []
    data.inventory.push(v)
    await auth.saveUserData({name:user.name, email:user.email, inventory:data.inventory})
    
    const list = document.getElementById('inventory-list')
    if(list){
      const idx = data.inventory.length - 1
      const li = el('li',{class:'inventory-item-full'},
        el('span',{class:'item-number'},`${idx + 1}.`),
        el('span',{class:'item-icon'},'📦'),
        el('span',{class:'item-name'}, v),
        el('button',{class:'btn-remove', onClick:()=> removeItem(idx)},'×')
      )
      list.appendChild(li)
    } else {
      // Reload if list doesn't exist (empty state)
      renderInventory(appEl)
      return
    }
    document.getElementById('new-item').value = ''
    showToast('Item added successfully', 'success')
  }

  async function removeItem(idx){
    if(!confirm('Are you sure you want to remove this item?')) return
    data.inventory.splice(idx, 1)
    await auth.saveUserData({name:user.name, email:user.email, inventory:data.inventory})
    showToast('Item removed', 'success')
    renderInventory(appEl)
  }
}

export async function renderTraining(appEl){
  const user = auth.getCurrentUser()
  if(!user){ location.hash = '#/login'; return }
  appEl.innerHTML = ''
  
  const header = el('div',{class:'training-header'},
    el('div',{style:'display:flex;justify-content:space-between;align-items:center;width:100%;'},
      el('div',{},
        el('h1',{},'Training Center'),
        el('p',{class:'muted'},'Create and access interactive training modules and video resources')
      ),
      el('button',{class:'btn btn-large primary', onClick:()=> renderCreateTraining(appEl)},'➕ Create Training')
    )
  )
  
  // Load trainings
  const trainings = await training.getTrainings()
  
  if(trainings.length === 0){
    const emptyState = el('div',{class:'card',style:'text-align:center;padding:3rem;'},
      el('span',{style:'font-size:4rem;display:block;margin-bottom:1rem;'},'📚'),
      el('h2',{},'No Trainings Yet'),
      el('p',{class:'muted'},'Create your first training module to get started'),
      el('button',{class:'btn btn-large primary', onClick:()=> renderCreateTraining(appEl), style:'margin-top:1.5rem;'},'Create Training')
    )
    appEl.appendChild(header)
    appEl.appendChild(emptyState)
    return
  }
  
  const trainingsGrid = el('div',{class:'trainings-grid'},
    ...trainings.map(t => el('div',{class:'card training-item-card'},
      el('div',{class:'training-item-header'},
        el('div',{class:'training-item-icon'},'🎓'),
        el('div',{class:'training-item-info',style:'flex:1;'},
          el('h3',{},t.title),
          el('p',{class:'muted small'},t.description || 'No description')
        ),
        t.created_by === user.email ? el('button',{class:'btn-remove', onClick:()=> deleteTrainingItem(t.id)},'×') : null
      ),
      el('div',{class:'training-item-content'},
        t.video_url ? el('div',{class:'training-video-preview'},
          el('video',{src:t.video_url, controls:true, style:'width:100%;max-height:200px;border-radius:8px;'})
        ) : null,
        t.content ? el('div',{class:'training-text-preview',style:'margin-top:1rem;padding:1rem;background:#f8fafc;border-radius:8px;max-height:150px;overflow-y:auto;'},
          el('p',{style:'white-space:pre-wrap;'},t.content.substring(0, 200) + (t.content.length > 200 ? '...' : ''))
        ) : null
      ),
      el('div',{class:'training-item-footer'},
        el('span',{class:'muted small'},`Created by ${t.created_by}`),
        el('button',{class:'btn primary', onClick:()=> viewTraining(t.id)},'View Training')
      )
    ))
  )
  
  appEl.appendChild(header)
  appEl.appendChild(trainingsGrid)
  
  async function deleteTrainingItem(id){
    if(!confirm('Are you sure you want to delete this training?')) return
    const res = await training.deleteTraining(id)
    if(res.ok){
      showToast('Training deleted', 'success')
      renderTraining(appEl)
    } else {
      showToast(res.error || 'Failed to delete', 'error')
    }
  }
  
  async function viewTraining(id){
    const t = await training.getTraining(id)
    if(t){
      renderTrainingView(appEl, t)
    }
  }
}

export function renderCreateTraining(appEl){
  const user = auth.getCurrentUser()
  if(!user){ location.hash = '#/login'; return }
  appEl.innerHTML = ''
  
  const form = el('div',{class:'card',style:'max-width:800px;margin:0 auto;'},
    el('div',{class:'section-header'},
      el('h2',{},'Create New Training'),
      el('button',{class:'btn', onClick:()=> renderTraining(appEl)},'← Back')
    ),
    el('div',{class:'form-row'},
      el('label',{for:'training-title',class:'form-label'},'Title *'),
      el('input',{id:'training-title',placeholder:'Enter training title',type:'text',required:true})
    ),
    el('div',{class:'form-row'},
      el('label',{for:'training-description',class:'form-label'},'Description'),
      el('input',{id:'training-description',placeholder:'Brief description of the training',type:'text'})
    ),
    el('div',{class:'form-row'},
      el('label',{for:'training-content',class:'form-label'},'Content'),
      el('textarea',{id:'training-content',placeholder:'Enter training content, instructions, notes, etc.',rows:10,style:'min-height:200px;resize:vertical;'})
    ),
    el('div',{class:'form-row'},
      el('label',{for:'training-video',class:'form-label'},'Video (Optional)'),
      el('input',{id:'training-video',type:'file',accept:'video/*',onChange:handleVideoSelect}),
      el('p',{class:'form-hint muted small'},'Upload a video file to accompany your training'),
      el('div',{id:'video-preview',style:'margin-top:1rem;display:none;'},
        el('video',{id:'video-preview-element',controls:true,style:'width:100%;max-height:300px;border-radius:8px;'})
      )
    ),
    el('div',{class:'actions'},
      el('button',{class:'btn btn-large primary', onClick:onSubmit},'Create Training'),
      el('button',{class:'btn btn-large', onClick:()=> renderTraining(appEl)},'Cancel')
    )
  )
  
  appEl.appendChild(form)
  
  let selectedVideoFile = null
  let videoUrl = null
  
  function handleVideoSelect(e){
    const file = e.target.files[0]
    if(file){
      if(file.size > 50 * 1024 * 1024){
        showToast('Video file too large (max 50MB)', 'error')
        e.target.value = ''
        return
      }
      selectedVideoFile = file
      const preview = document.getElementById('video-preview')
      const previewEl = document.getElementById('video-preview-element')
      if(preview && previewEl){
        preview.style.display = 'block'
        previewEl.src = URL.createObjectURL(file)
      }
    }
  }
  
  async function onSubmit(){
    const title = document.getElementById('training-title').value.trim()
    const description = document.getElementById('training-description').value.trim()
    const content = document.getElementById('training-content').value.trim()
    
    if(!title){
      showToast('Title is required', 'error')
      return
    }
    
    // Upload video if selected
    if(selectedVideoFile){
      showToast('Uploading video...', 'success')
      const uploadRes = await training.uploadVideo(selectedVideoFile, user.email)
      if(uploadRes.ok){
        videoUrl = uploadRes.video_url
      } else {
        showToast(uploadRes.error || 'Failed to upload video', 'error')
        return
      }
    }
    
    // Create training
    const res = await training.createTraining(user.email, {
      title,
      description,
      content,
      video_url: videoUrl
    })
    
    if(res.ok){
      showToast('Training created successfully!', 'success')
      renderTraining(appEl)
    } else {
      showToast(res.error || 'Failed to create training', 'error')
    }
  }
}

export function renderTrainingView(appEl, trainingData){
  const user = auth.getCurrentUser()
  if(!user){ location.hash = '#/login'; return }
  appEl.innerHTML = ''
  
  const header = el('div',{class:'training-view-header'},
    el('button',{class:'btn', onClick:()=> renderTraining(appEl)},'← Back to Trainings'),
    el('h1',{},trainingData.title),
    el('p',{class:'muted'},trainingData.description || '')
  )
  
  const content = el('div',{class:'card training-view-content'},
    trainingData.video_url ? el('div',{class:'training-video-full',style:'margin-bottom:2rem;'},
      el('h3',{},'Video'),
      el('video',{src:trainingData.video_url, controls:true, style:'width:100%;max-height:500px;border-radius:12px;margin-top:1rem;'})
    ) : null,
    trainingData.content ? el('div',{class:'training-text-full'},
      el('h3',{},'Content'),
      el('div',{style:'white-space:pre-wrap;line-height:1.8;margin-top:1rem;padding:1.5rem;background:#f8fafc;border-radius:12px;'},
        trainingData.content
      )
    ) : null,
    !trainingData.video_url && !trainingData.content ? el('div',{class:'empty-state'},
      el('p',{class:'muted'},'No content available for this training')
    ) : null
  )
  
  appEl.appendChild(header)
  appEl.appendChild(content)
}

export function renderTrainingModules(appEl){
  const user = auth.getCurrentUser()
  if(!user){ location.hash = '#/login'; return }
  appEl.innerHTML = ''
  
  const header = el('div',{class:'modules-header'},
    el('h1',{},'Training Modules'),
    el('p',{class:'muted'},'Complete these modules to build your knowledge and skills')
  )
  
  const modules = [
    {title:'Module 1: Fundamentals', desc:'Learn the basics and core concepts', duration:'30 min', status:'available'},
    {title:'Module 2: Intermediate Skills', desc:'Build on your foundation with advanced techniques', duration:'45 min', status:'available'},
    {title:'Module 3: Advanced Techniques', desc:'Master complex scenarios and expert-level practices', duration:'60 min', status:'available'}
  ]
  
  const modulesList = el('div',{class:'modules-list'},
    ...modules.map(m => el('div',{class:'card module-card'},
      el('div',{class:'module-header'},
        el('div',{class:'module-icon'},'📚'),
        el('div',{class:'module-info'},
          el('h3',{},m.title),
          el('p',{class:'muted'},m.desc)
        )
      ),
      el('div',{class:'module-footer'},
        el('span',{class:'module-duration'},`⏱ ${m.duration}`),
        el('button',{class:'btn primary', onClick:()=> showToast(`Starting ${m.title}...`, 'success')},'Start Module')
      )
    ))
  )
  
  appEl.appendChild(header)
  appEl.appendChild(modulesList)
}

export function renderVideos(appEl){
  const user = auth.getCurrentUser()
  if(!user){ location.hash = '#/login'; return }
  appEl.innerHTML = ''
  
  const header = el('div',{class:'videos-header'},
    el('h1',{},'Video Resources'),
    el('p',{class:'muted'},'Watch expert-led tutorials and learn at your own pace')
  )
  
  const videos = [
    {title:'How to use Train Hub', desc:'Get started with Train Hub and learn the basics', duration:'15 min', thumbnail:'🎥'},
    {title:'Effective Training Techniques', desc:'Master proven methods for effective training', duration:'25 min', thumbnail:'🎓'},
    {title:'Safety and Best Practices', desc:'Learn essential safety protocols and industry best practices', duration:'20 min', thumbnail:'🛡️'}
  ]
  
  const videosGrid = el('div',{class:'videos-grid'},
    ...videos.map(v => el('div',{class:'card video-card'},
      el('div',{class:'video-thumbnail'},v.thumbnail),
      el('div',{class:'video-content'},
        el('h3',{},v.title),
        el('p',{class:'muted'},v.desc),
        el('div',{class:'video-meta'},
          el('span',{class:'video-duration'},`⏱ ${v.duration}`)
        ),
        el('button',{class:'btn primary', onClick:(e)=>{e.preventDefault(); showToast(`Playing: ${v.title}`, 'success')}},'Watch Video')
      )
    ))
  )
  
  appEl.appendChild(header)
  appEl.appendChild(videosGrid)
}
