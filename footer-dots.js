// Animated dot-grid in the footer — Three.js particle wave
(function () {
  'use strict';

  function init() {
    var footer = document.getElementById('siteFooter');
    if (!footer || typeof THREE === 'undefined') return;

    var SEPARATION = 110;
    var AMOUNTX    = 38;
    var AMOUNTY    = 14;

    var W = footer.offsetWidth;
    var H = footer.offsetHeight;
    if (W < 2 || H < 2) return;

    /* ── Scene ── */
    var scene    = new THREE.Scene();
    var camera   = new THREE.PerspectiveCamera(72, W / H, 1, 10000);
    camera.position.set(0, 340, 1100);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    var cvs = renderer.domElement;
    cvs.style.cssText =
      'position:absolute;top:0;left:0;pointer-events:none;z-index:0;';
    footer.style.position = 'relative';
    footer.style.overflow  = 'hidden';
    footer.insertBefore(cvs, footer.firstChild);

    /* Lift content above canvas */
    var ch = footer.children;
    for (var i = 0; i < ch.length; i++) {
      if (ch[i] !== cvs) {
        ch[i].style.position = 'relative';
        ch[i].style.zIndex   = '1';
      }
    }

    /* ── Geometry ── */
    var total  = AMOUNTX * AMOUNTY;
    var posArr = new Float32Array(total * 3);
    var n = 0;
    for (var ix = 0; ix < AMOUNTX; ix++) {
      for (var iy = 0; iy < AMOUNTY; iy++) {
        posArr[n++] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        posArr[n++] = 0;
        posArr[n++] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
      }
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',
      new THREE.Float32BufferAttribute(posArr, 3));

    /* ── Material — additive blend for a soft glow on dark bg ── */
    var material = new THREE.PointsMaterial({
      size:           7,
      color:          0xFF4444,   // rojo tenue; swap for 0x888888 if prefers gris
      transparent:    true,
      opacity:        0.45,
      sizeAttenuation: true,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false
    });

    var points = new THREE.Points(geometry, material);
    scene.add(points);

    /* ── Animation ── */
    var count     = 0;
    var visible   = false;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(footer);
    } else {
      visible = true;
    }

    var raf = window.requestAnimationFrame ||
              function (fn) { return setTimeout(fn, 16); };

    function animate() {
      raf(animate);
      if (!visible) return;

      var arr = geometry.attributes.position.array;
      var j = 0;
      for (var ix = 0; ix < AMOUNTX; ix++) {
        for (var iy = 0; iy < AMOUNTY; iy++) {
          arr[j * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 38 +
            Math.sin((iy + count) * 0.5) * 38;
          j++;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.06;
    }

    animate();

    /* ── Resize ── */
    window.addEventListener('resize', function () {
      var nW = footer.offsetWidth;
      var nH = footer.offsetHeight;
      if (nW < 2 || nH < 2) return;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
