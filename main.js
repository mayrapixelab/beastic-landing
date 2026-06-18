gsap.registerPlugin(ScrollTrigger)

// ═══════════════════════════════════
// LENIS — smooth scroll
// ═══════════════════════════════════
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)


// ═══════════════════════════════════
// HERO — VIDEO SCRUBBING
// ═══════════════════════════════════
const video      = document.getElementById('heroVideo')
const slides     = [0,1,2,3].map(i => document.getElementById('slide' + i))
const dots       = [0,1,2,3].map(i => document.getElementById('dot'   + i))
const scrollHint = document.getElementById('scrollHint')
const isMobile   = window.matchMedia('(max-width: 768px)').matches

const BREAKPOINTS = [
  { start: 0,    end: 0.15 },
  { start: 0.05, end: 0.32 },
  { start: 0.28, end: 0.72 },
  { start: 0.68, end: 1.0  },
]

function slideOpacity(i, p) {
  const { start, end } = BREAKPOINTS[i]
  const fade = Math.min(0.06, (end - start) * 0.25)
  if (p < start || p > end) return 0
  if (p < start + fade) return (p - start) / fade
  if (p > end   - fade) return (end - p)   / fade
  return 1
}

slides[0].style.opacity = 1
gsap.to(scrollHint, { opacity: 1, duration: 1.2, delay: 1, ease: 'power2.out' })

if (isMobile) {
  // Móvil: autoplay loop, sin scroll scrubbing
  video.muted       = true
  video.loop        = true
  video.playsInline = true
  video.autoplay    = true
  video.load()
  video.play().catch(() => {})
} else {
  // Clamp to 0.1s so we never land on the black leader frames at currentTime=0
  const MIN_T = 0.1

  function showFirstFrame() {
    try { video.currentTime = MIN_T } catch (e) {}
  }
  if (video.readyState >= 2) showFirstFrame()
  else video.addEventListener('loadeddata', showFirstFrame, { once: true })

  ScrollTrigger.create({
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress
      if (video.readyState >= 2 && video.duration)
        video.currentTime = Math.max(MIN_T, p * video.duration)
      slides.forEach((el, i) => { el.style.opacity = slideOpacity(i, p) })
      let active = 0
      BREAKPOINTS.forEach((bp, i) => { if (p >= bp.start) active = i })
      dots.forEach((d, i) => d.classList.toggle('active', i === active))
      if (p > 0.03)
        scrollHint.style.opacity = Math.max(0, 1 - (p - 0.03) / 0.05).toString()
    },
  })
}


// ═══════════════════════════════════
// PODER PURO — SPLIT CHARS + BLUR CURSOR
// ═══════════════════════════════════

// Divide el texto de un elemento en <span class="ch"> por letra
function splitChars(el) {
  const text = el.textContent.trim()
  el.innerHTML = ''
  text.split('').forEach(char => {
    if (char === ' ') {
      const sp = document.createElement('span')
      sp.className = 'ch-space'
      sp.innerHTML = '&nbsp;'
      el.appendChild(sp)
    } else {
      const sp = document.createElement('span')
      sp.className = 'ch'
      sp.textContent = char
      el.appendChild(sp)
    }
  })
  return el.querySelectorAll('.ch')
}

const titleEl    = document.getElementById('poderTitle')
const subtitleEl = document.getElementById('poderSubtitle')

const titleChars    = splitChars(titleEl)
const subtitleChars = splitChars(subtitleEl)

// Todos los chars interactivos
const allChars = [...titleChars, ...subtitleChars]

// GSAP quickTo por char — permite animar filter de forma óptima
const blurSetters = allChars.map(el =>
  gsap.quickTo(el, '--blur', { duration: 0.35, ease: 'power2.out' })
)

// Aplicar variable CSS como filter vía JS directo
// (quickTo no anima filter strings, pero sí custom props via gsap.set)
// Usamos el enfoque directo con gsap.to overwrite:true
function setBlur(el, px) {
  gsap.to(el, {
    filter: `blur(${px.toFixed(1)}px)`,
    duration: px > 0 ? 0.25 : 0.5,
    ease: px > 0 ? 'power2.out' : 'power2.inOut',
    overwrite: true,
  })
}

// Cursor personalizado
const cursor = document.getElementById('poderCursor')
const section = document.getElementById('poderSection')

let mouseX = -999, mouseY = -999
let cursorVisible = false

section.addEventListener('mouseenter', () => {
  cursorVisible = true
  gsap.to(cursor, { opacity: 1, duration: 0.3 })
})
section.addEventListener('mouseleave', () => {
  cursorVisible = false
  gsap.to(cursor, { opacity: 0, duration: 0.3 })
  // Quitar blur de todos al salir
  allChars.forEach(el => setBlur(el, 0))
})

// Seguimiento del cursor
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY

  // Mover cursor custom
  gsap.to(cursor, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.18,
    ease: 'power2.out',
  })

  if (!cursorVisible) return

  // Calcular blur por proximidad a cada char
  allChars.forEach((el, i) => {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    const dist = Math.hypot(mouseX - cx, mouseY - cy)
    const radius = 90  // px de influencia
    // Blur máximo directamente encima, 0 fuera del radio
    const blur = dist < radius
      ? (1 - dist / radius) * 10
      : 0
    setBlur(el, blur)
  })
})


// ═══════════════════════════════════
// PODER PURO — entrada con scroll
// ═══════════════════════════════════
gsap.from(['.poder-eyebrow', '.poder-title', '.poder-subtitle', '.poder-divider', '.poder-body'], {
  opacity: 0,
  y: 50,
  stagger: 0.1,
  duration: 1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.poder-section',
    start: 'top 70%',
  },
})


// ═══════════════════════════════════
// SHOWCASE — DOMINA CADA REINO
// ═══════════════════════════════════

const SC_PRODUCTS = [
  {
    label:  'Proteína',
    name:   'Beast Pro',
    img:    'Productos/BEAST%20PRO%202.7%20KG%20MOKA_f.png',
    card:   '#1e6fd4',
    pill:   '#1e6fd4',
    shadow: 'rgba(30,111,212,0.42)',
  },
  {
    label:  'Óxido',
    name:   'Beast Mode Óxido',
    img:    'Productos/BEAST-MODE-(PRE-WORKOUT)-350-g-MORAS.png',
    card:   '#cc2020',
    pill:   '#cc2020',
    shadow: 'rgba(204,32,32,0.45)',
  },
  {
    label:  'Colágeno',
    name:   'Colágeno',
    img:    'Productos/BEAST%20ISOLATE%202.2%20kg%20HELADO%20DE%20VAINILLA_f.png',
    card:   '#7788bb',
    pill:   '#6677aa',
    shadow: 'rgba(100,120,180,0.35)',
  },
  {
    label:  'Creatina',
    name:   'Creatina',
    img:    'Productos/CREATINA%20350g_f.png',
    card:   '#1a8c3a',
    pill:   '#1a8c3a',
    shadow: 'rgba(26,140,58,0.38)',
  },
]

let scActive = 1  // start on Óxido

const scCardsEl = document.getElementById('showcaseCards')
const scNavEl   = document.getElementById('showcaseNav')
const scPillEl  = document.getElementById('stabPill')
const scTabs    = [...scNavEl.querySelectorAll('.stab')]

// Build card elements
SC_PRODUCTS.forEach((p, i) => {
  const el = document.createElement('div')
  el.className = 'scard'
  el.dataset.index = i
  el.style.setProperty('--card-bg',     p.card)
  el.style.setProperty('--card-shadow', p.shadow)
  el.innerHTML = `<img src="${p.img}" alt="${p.label}" draggable="false"><span class="scard-name">${p.name}</span>`
  el.addEventListener('click', () => { if (i !== scActive) scSwitchTo(i) })
  scCardsEl.appendChild(el)
})

// GSAP properties per relative slot position
function scState(pos) {
  if (pos ===  0) return { x:    0, scale: 1.0,  rotation:  0, opacity: 1,    y: 0,  zIndex: 3 }
  if (pos ===  1) return { x:  330, scale: 0.74, rotation:  4, opacity: 0.72, y: 26, zIndex: 2 }
  if (pos === -1) return { x: -330, scale: 0.74, rotation: -4, opacity: 0.72, y: 26, zIndex: 2 }
  return { x: pos > 0 ? 640 : -640, scale: 0.55, rotation: 0, opacity: 0, y: 50, zIndex: 1 }
}

function scApply(el, pos, animate) {
  const s = scState(pos)
  ;(animate ? gsap.to : gsap.set)(el, {
    ...s, duration: 0.72, ease: 'power3.out', overwrite: true,
  })
}

function scMovePill(i) {
  gsap.to(scPillEl, {
    x:               scTabs[i].offsetLeft,
    width:           scTabs[i].offsetWidth,
    backgroundColor: SC_PRODUCTS[i].pill,
    duration:        0.42,
    ease:            'power3.inOut',
    overwrite:       true,
  })
}

function scSwitchTo(index) {
  scTabs[scActive].classList.remove('active')
  scTabs[index].classList.add('active')
  scActive = index
  ;[...scCardsEl.querySelectorAll('.scard')].forEach((el, i) => scApply(el, i - scActive, true))
  scMovePill(index)
}

// Initial placement (no animation)
;[...scCardsEl.querySelectorAll('.scard')].forEach((el, i) => scApply(el, i - scActive, false))
scTabs[scActive].classList.add('active')
// Wait for fonts so offsetWidth reflects Gobold metrics
document.fonts.ready.then(() => {
  gsap.set(scPillEl, {
    x:               scTabs[scActive].offsetLeft,
    width:           scTabs[scActive].offsetWidth,
    backgroundColor: SC_PRODUCTS[scActive].pill,
  })
})

// Tab click handlers
scTabs.forEach((btn, i) => btn.addEventListener('click', () => scSwitchTo(i)))

// Scroll reveal
gsap.from(['.showcase-eyebrow', '.showcase-nav'], {
  opacity: 0, y: 28, stagger: 0.1, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.showcase-section', start: 'top 78%' },
})
gsap.from('.showcase-stage', {
  opacity: 0, y: 44, duration: 1.2, ease: 'power3.out',
  scrollTrigger: { trigger: '.showcase-section', start: 'top 70%' },
})


// ═══════════════════════════════════
// PRODUCTO DESTACADO
// ═══════════════════════════════════

// Marquees — build items y duplicar para loop seamless
function buildMarquee(el) {
  const chunk = Array.from({ length: 16 }, () =>
    `<span class="hl-mi"><em>BEAST</em> MODE</span>`
  ).join('')
  el.innerHTML = chunk + chunk
}
buildMarquee(document.getElementById('hlMarqTop'))
buildMarquee(document.getElementById('hlMarqBot'))

// Cursor + 3D tilt + glare
const hlRight    = document.getElementById('hlRight')
const hlCard     = document.getElementById('hlCard')
const hlCardGlare = document.getElementById('hlCardGlare')
const hlCta      = document.querySelector('.hl-cta')

const hlCursorEl = document.createElement('div')
hlCursorEl.className = 'hl-cursor'
document.body.appendChild(hlCursorEl)
gsap.set(hlCursorEl, { xPercent: -50, yPercent: -50 })

hlRight.addEventListener('mouseenter', () =>
  gsap.to(hlCursorEl, { opacity: 1, duration: 0.3 })
)
hlRight.addEventListener('mouseleave', () => {
  gsap.to(hlCursorEl, { opacity: 0, duration: 0.3 })
  // Reset card tilt
  gsap.to(hlCard, {
    rotateY: 0, rotateX: 0,
    duration: 1, ease: 'elastic.out(0.8, 0.4)', overwrite: true,
  })
  // Reset CTA magnet
  gsap.to(hlCta, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
})

hlRight.addEventListener('mousemove', (e) => {
  // Cursor
  gsap.to(hlCursorEl, {
    x: e.clientX, y: e.clientY,
    duration: 0.14, ease: 'power2.out',
  })

  const rRect = hlRight.getBoundingClientRect()
  const nx = ((e.clientX - rRect.left) / rRect.width  - 0.5) * 2  // -1 → 1
  const ny = ((e.clientY - rRect.top)  / rRect.height - 0.5) * 2

  // 3D tilt
  gsap.to(hlCard, {
    rotateY:  nx * 11,
    rotateX: -ny * 7,
    duration: 0.5, ease: 'power2.out', overwrite: true,
  })

  // Glare position (relativo a la card)
  const cRect = hlCard.getBoundingClientRect()
  const gx = ((e.clientX - cRect.left) / cRect.width  * 100).toFixed(1)
  const gy = ((e.clientY - cRect.top)  / cRect.height * 100).toFixed(1)
  hlCard.style.setProperty('--gx', `${gx}%`)
  hlCard.style.setProperty('--gy', `${gy}%`)

  // Magnetic CTA
  const ctaRect = hlCta.getBoundingClientRect()
  const ctaCx   = ctaRect.left + ctaRect.width  / 2
  const ctaCy   = ctaRect.top  + ctaRect.height / 2
  const dist    = Math.hypot(e.clientX - ctaCx, e.clientY - ctaCy)
  const magR    = 110
  if (dist < magR) {
    const strength = (1 - dist / magR) * 18
    gsap.to(hlCta, {
      x: (e.clientX - ctaCx) / dist * strength,
      y: (e.clientY - ctaCy) / dist * strength,
      duration: 0.35, ease: 'power2.out', overwrite: true,
    })
  } else {
    gsap.to(hlCta, { x: 0, y: 0, duration: 0.5, ease: 'power2.out', overwrite: true })
  }
})

// ÓXIDO — título full-width (JS fitText)
function fitHlTitle() {
  const el = document.querySelector('.hl-title')
  if (!el) return
  const parent = el.closest('.hl-right')
  const cs     = window.getComputedStyle(parent)
  const innerW = parent.clientWidth
                 - parseFloat(cs.paddingLeft)
                 - parseFloat(cs.paddingRight)
  // Span off-screen para medir — inline-block no encoge dentro de flex stretch
  const tmp = document.createElement('span')
  tmp.style.cssText = "font-family:'Gobold High Bold',sans-serif;font-size:100px;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;visibility:hidden;position:fixed;top:-9999px;left:-9999px;"
  tmp.textContent = el.textContent
  document.body.appendChild(tmp)
  const textW = tmp.getBoundingClientRect().width
  document.body.removeChild(tmp)
  el.style.fontSize = (100 * (innerW / textW) * 0.99) + 'px'
}
document.fonts.ready.then(fitHlTitle)
window.addEventListener('resize', fitHlTitle)

// Arrow — toggle Card 1 / Card 2
const HL_CARDS = [
  'Productos%20destacados/Card%201.webp',
  'Productos%20destacados/Card%202.webp',
]
let hlCardIdx = 1  // arranca en Card 2

document.querySelector('.hl-card-arrow').addEventListener('click', () => {
  const img = document.querySelector('#hlCard img')
  hlCardIdx = (hlCardIdx + 1) % HL_CARDS.length
  gsap.timeline()
    .to(img, { opacity: 0, scale: 0.95, duration: 0.22, ease: 'power2.in' })
    .call(() => { img.src = HL_CARDS[hlCardIdx] })
    .to(img, { opacity: 1, scale: 1,    duration: 0.32, ease: 'power2.out' })
})

// Scroll reveal
gsap.from('.hl-left', {
  opacity: 0, duration: 1.1, ease: 'power3.out',
  scrollTrigger: { trigger: '.highlight-section', start: 'top 80%' },
})
gsap.from('.hl-title', {
  opacity: 0, y: 50, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.highlight-section', start: 'top 72%' },
})
gsap.from(['.hl-card-wrap', '.hl-info-row', '.hl-bottom'], {
  opacity: 0, y: 35, stagger: 0.12, duration: 1.1, ease: 'power3.out',
  scrollTrigger: { trigger: '.highlight-section', start: 'top 65%' },
})
gsap.from('.hl-left-cta-wrap', {
  opacity: 0, duration: 0.9, ease: 'power3.out',
  scrollTrigger: { trigger: '.highlight-section', start: 'top 78%' },
})


// ═══════════════════════════════════
// PDP MODAL
// ═══════════════════════════════════
const pdpOverlay = document.getElementById('pdpOverlay')
const pdpModal   = document.getElementById('pdpModal')
const pdpClose   = document.getElementById('pdpClose')

let pdpTl = null

function openPdp() {
  document.body.style.overflow = 'hidden'
  pdpOverlay.style.display = 'flex'

  if (pdpTl) pdpTl.kill()

  // Reset internal elements before animating
  gsap.set(['.pdp-brand-logo', '.pdp-name', '.pdp-type', '.pdp-claim',
            '.pdp-spec', '.pdp-add-cart', '.pdp-hero-img'], { clearProps: 'all' })

  pdpTl = gsap.timeline()
  pdpTl
    .fromTo(pdpOverlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.32, ease: 'power2.out' }, 0)
    .fromTo(pdpModal,
      { opacity: 0, scale: 0.92, y: 28 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0)
    .fromTo('.pdp-brand-logo',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0,  duration: 0.36, ease: 'power2.out' }, 0.22)
    .fromTo('.pdp-name',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0,  duration: 0.4,  ease: 'power3.out' }, 0.28)
    .fromTo(['.pdp-type', '.pdp-claim'],
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0,  duration: 0.32, stagger: 0.06, ease: 'power2.out' }, 0.34)
    .fromTo('.pdp-spec',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0,  duration: 0.32, stagger: 0.07, ease: 'power2.out' }, 0.42)
    .fromTo('.pdp-add-cart',
      { opacity: 0, scale: 0.82 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, 0.6)
    .fromTo('.pdp-hero-img',
      { opacity: 0, scale: 1.08, x: 18 },
      { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 0.18)
}

function closePdp() {
  if (pdpTl) pdpTl.kill()
  pdpTl = gsap.timeline({
    onComplete: () => {
      pdpOverlay.style.display = 'none'
      document.body.style.overflow = ''
    }
  })
  pdpTl
    .to(pdpModal,   { opacity: 0, scale: 0.92, y: 28, duration: 0.3, ease: 'power2.in' }, 0)
    .to(pdpOverlay, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.04)
}

// Open: ambos botones Ver detalles
document.querySelectorAll('.hl-left-cta, .hl-cta').forEach(btn => {
  btn.addEventListener('click', e => { e.preventDefault(); openPdp() })
})

// Close: X button, click en overlay, Escape
pdpClose.addEventListener('click', closePdp)
pdpOverlay.addEventListener('click', e => { if (e.target === pdpOverlay) closePdp() })
document.addEventListener('keydown', e => { if (e.key === 'Escape' && pdpOverlay.style.display === 'flex') closePdp() })


// ═══════════════════════════════════
// CTA SECTION — Spotlight mouse
// ═══════════════════════════════════
;(() => {
  const section    = document.querySelector('.cta-section')
  const spotlight  = document.getElementById('ctaSpotlight')
  const bgImg      = document.querySelector('.cta-bg-img')
  if (!section || !spotlight) return

  // Cursor personalizado
  const ctaCursor = document.createElement('div')
  ctaCursor.className = 'cta-cursor'
  document.body.appendChild(ctaCursor)
  gsap.set(ctaCursor, { xPercent: -50, yPercent: -50 })

  let mx = 50, my = 50
  let cx = 50, cy = 50
  let px = 0,  py = 0
  const spotR = { value: 0 }

  gsap.ticker.add(() => {
    cx += (mx - cx) * 0.07
    cy += (my - cy) * 0.07
    spotlight.style.setProperty('--mx', cx.toFixed(2) + '%')
    spotlight.style.setProperty('--my', cy.toFixed(2) + '%')

    const tx = (mx - 50) * -0.014
    const ty = (my - 50) * -0.014
    px += (tx - px) * 0.05
    py += (ty - py) * 0.05
    gsap.set(bgImg, { x: px + '%', y: py + '%', scale: 1.04 })
  })

  section.addEventListener('mousemove', e => {
    const r = section.getBoundingClientRect()
    mx = (e.clientX - r.left) / r.width  * 100
    my = (e.clientY - r.top)  / r.height * 100
    gsap.to(ctaCursor, { x: e.clientX, y: e.clientY, duration: 0.12, ease: 'power2.out' })
  })

  section.addEventListener('mouseenter', () => {
    gsap.to(ctaCursor, { opacity: 1, duration: 0.3 })
    gsap.to(spotR, {
      value: 300,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => spotlight.style.setProperty('--r', spotR.value + 'px'),
    })
  })

  section.addEventListener('mouseleave', () => {
    gsap.to(ctaCursor, { opacity: 0, duration: 0.25 })
    gsap.to(spotR, {
      value: 0,
      duration: 0.85,
      ease: 'power2.inOut',
      onUpdate: () => spotlight.style.setProperty('--r', spotR.value + 'px'),
    })
  })

  // Scroll reveal
  gsap.from(['.cta-eyebrow', '.cta-heading', '.cta-body', '.cta-discover'], {
    opacity: 0, y: 44,
    stagger: 0.13, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 72%' },
  })
})()


// ═══════════════════════════════════
// FOOTER — wordmark fitText + reveal
// ═══════════════════════════════════
function fitFooterWordmark() {
  const el = document.querySelector('.footer-wordmark')
  if (!el) return
  const parentW = el.parentElement.clientWidth
  const tmp = document.createElement('span')
  tmp.style.cssText = "font-family:'Gobold High Bold',sans-serif;font-size:100px;letter-spacing:-0.01em;text-transform:uppercase;white-space:nowrap;visibility:hidden;position:fixed;top:-9999px;left:-9999px;"
  tmp.textContent = el.textContent
  document.body.appendChild(tmp)
  const textW = tmp.getBoundingClientRect().width
  document.body.removeChild(tmp)
  el.style.fontSize = (100 * (parentW / textW) * 0.55) + 'px'
}
document.fonts.ready.then(fitFooterWordmark)
window.addEventListener('resize', fitFooterWordmark)

// Scroll reveal footer
gsap.from('.footer-top > *', {
  opacity: 0, y: 28, stagger: 0.1, duration: 0.9, ease: 'power3.out',
  scrollTrigger: { trigger: '.site-footer', start: 'top 85%' },
})
gsap.from('.footer-wordmark', {
  opacity: 0, y: '15%', duration: 1.2, ease: 'power3.out',
  scrollTrigger: { trigger: '.footer-wordmark-wrap', start: 'top 95%' },
})

// ═══════════════════════════════════
// NAVBAR — entry + scroll state
// ═══════════════════════════════════
;(function () {
  const nav = document.getElementById('siteNav')

  // Slide in from top on load
  gsap.from(nav, {
    y: -nav.offsetHeight - 4,
    opacity: 0,
    duration: 1.1,
    ease: 'power3.out',
    delay: 0.5,
  })

  // Darken glass past 80px of scroll
  ScrollTrigger.create({
    start: 80,
    end: 81,
    onEnter: () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled'),
  })
})()

// ═══════════════════════════════════
// NAVBAR — hamburger móvil
// ═══════════════════════════════════
;(function () {
  const hamburger  = document.getElementById('navHamburger')
  const mobileMenu = document.getElementById('navMobile')
  if (!hamburger || !mobileMenu) return

  let open = false

  const openMenu = () => {
    open = true
    hamburger.classList.add('is-open')
    hamburger.setAttribute('aria-expanded', 'true')
    mobileMenu.classList.add('is-open')
    mobileMenu.setAttribute('aria-hidden', 'false')
    gsap.to(mobileMenu, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' })
  }

  const closeMenu = () => {
    open = false
    hamburger.classList.remove('is-open')
    hamburger.setAttribute('aria-expanded', 'false')
    gsap.to(mobileMenu, {
      opacity: 0, y: -10, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        mobileMenu.classList.remove('is-open')
        mobileMenu.setAttribute('aria-hidden', 'true')
      }
    })
  }

  hamburger.addEventListener('click', () => open ? closeMenu() : openMenu())
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu))

  // Cerrar con Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeMenu() })
})()
