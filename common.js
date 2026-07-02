gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

// Navbar entry + scroll darken
;(function () {
  const nav = document.getElementById('siteNav')
  gsap.from(nav, { y: -nav.offsetHeight - 4, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.2 })
  ScrollTrigger.create({
    start: 80, end: 81,
    onEnter:     () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled'),
  })
})()

// Hamburger
;(function () {
  const hamburger  = document.getElementById('navHamburger')
  const mobileMenu = document.getElementById('navMobile')
  if (!hamburger || !mobileMenu) return
  let open = false
  const openMenu  = () => {
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
      onComplete: () => { mobileMenu.classList.remove('is-open'); mobileMenu.setAttribute('aria-hidden', 'true') }
    })
  }
  hamburger.addEventListener('click', () => open ? closeMenu() : openMenu())
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu))
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeMenu() })
})()

// Footer wordmark fitText
;(function () {
  const el = document.querySelector('.footer-wordmark')
  if (!el) return
  function fit() {
    const parentW = el.parentElement.clientWidth
    const tmp = document.createElement('span')
    tmp.style.cssText = "font-family:'Gobold High Bold',sans-serif;font-size:100px;letter-spacing:-0.01em;text-transform:uppercase;white-space:nowrap;visibility:hidden;position:fixed;top:-9999px;left:-9999px;"
    tmp.textContent = el.textContent
    document.body.appendChild(tmp)
    const textW = tmp.getBoundingClientRect().width
    document.body.removeChild(tmp)
    el.style.fontSize = (100 * (parentW / textW) * 0.55) + 'px'
  }
  document.fonts.ready.then(fit)
  window.addEventListener('resize', fit)
})()

// Page hero reveal
gsap.from(['.ph-eyebrow', '.ph-title', '.ph-sub'], {
  opacity: 0, y: 36, stagger: 0.1, duration: 1, ease: 'power3.out', delay: 0.25,
})

// Generic scroll reveals
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    opacity: 0, y: 32, duration: 0.85, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  })
})

// Footer reveals
gsap.from('.footer-top > *', {
  opacity: 0, y: 26, stagger: 0.08, duration: 0.9, ease: 'power3.out',
  scrollTrigger: { trigger: '.site-footer', start: 'top 88%' },
})
gsap.from('.footer-wordmark', {
  opacity: 0, y: '15%', duration: 1.2, ease: 'power3.out',
  scrollTrigger: { trigger: '.footer-wordmark-wrap', start: 'top 95%' },
})
