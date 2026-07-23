// Ribbon Trails — cursor trail effect for poder section
// Converted from React/TS Originkit component to vanilla JS
(function () {
  'use strict';

  var DAMPENING = 0.1;
  var TENSION   = 0.95;
  var FRICTION  = 0.5;
  var REFERENCE_TRAILS = 20;
  var MAX_STROKE_L = 0.7;
  var MAX_COLORS = 5;

  function TrailNode() { this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; }

  function Line(cfg) {
    this.spring  = cfg.spring + 0.1 * Math.random() - 0.02;
    this.friction = cfg.friction + 0.01 * Math.random() - 0.002;
    this.cfg   = cfg;
    this.nodes = [];
    for (var i = 0; i < cfg.size; i++) {
      var n = new TrailNode();
      n.x = cfg.target.x; n.y = cfg.target.y;
      this.nodes.push(n);
    }
  }

  Line.prototype.update = function () {
    var sp = this.spring;
    var t  = this.cfg.target, d = this.cfg.dampening, tn = this.cfg.tension;
    var nd = this.nodes[0];
    nd.vx += (t.x - nd.x) * sp;
    nd.vy += (t.y - nd.y) * sp;
    for (var i = 0; i < this.nodes.length; i++) {
      nd = this.nodes[i];
      if (i > 0) {
        var pv = this.nodes[i - 1];
        nd.vx += (pv.x - nd.x) * sp;
        nd.vy += (pv.y - nd.y) * sp;
        nd.vx += pv.vx * d;
        nd.vy += pv.vy * d;
      }
      nd.vx *= this.friction; nd.vy *= this.friction;
      nd.x  += nd.vx;        nd.y  += nd.vy;
      sp *= tn;
    }
  };

  Line.prototype.draw = function (ctx) {
    var a, b, x = this.nodes[0].x, y = this.nodes[0].y;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (var i = 1; i < this.nodes.length - 2; i++) {
      a = this.nodes[i]; b = this.nodes[i + 1];
      ctx.quadraticCurveTo(a.x, a.y, 0.5*(a.x+b.x), 0.5*(a.y+b.y));
    }
    a = this.nodes[this.nodes.length - 2];
    b = this.nodes[this.nodes.length - 1];
    ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
    ctx.stroke(); ctx.closePath();
  };

  function parseColor(color) {
    var v = (color || '').trim();
    if (v.charAt(0) === '#') {
      var h = v.slice(1);
      if (h.length === 3) h = h.split('').map(function(c){ return c+c; }).join('');
      if (h.length >= 6) return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255, h.length===8?parseInt(h.slice(6,8),16)/255:1];
      return [1,1,1,1];
    }
    var m = v.match(/rgba?\(([^)]+)\)/i);
    if (m) { var p=m[1].split(',').map(parseFloat); return [(p[0]||0)/255,(p[1]||0)/255,(p[2]||0)/255,p[3]===undefined?1:p[3]]; }
    return [1,1,1,1];
  }

  function toLinear(c) { return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
  function toGamma(c)  { return c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; }

  function srgbToOklab(r,g,b) {
    var lr=toLinear(r),lg=toLinear(g),lb=toLinear(b);
    var l=Math.cbrt(0.4122214708*lr+0.5363325363*lg+0.0514459929*lb);
    var m=Math.cbrt(0.2119034982*lr+0.6806995451*lg+0.1073969566*lb);
    var s=Math.cbrt(0.0883024619*lr+0.2817188376*lg+0.6299787005*lb);
    return [0.2104542553*l+0.793617785*m-0.0040720468*s, 1.9779984951*l-2.428592205*m+0.4505937099*s, 0.0259040371*l+0.7827717662*m-0.808675766*s];
  }

  function oklabToSrgb(L,A,B) {
    var l=Math.pow(L+0.3963377774*A+0.2158037573*B,3);
    var m=Math.pow(L-0.1055613458*A-0.0638541728*B,3);
    var s=Math.pow(L-0.0894841775*A-1.291485548*B,3);
    return [toGamma(4.0767416621*l-3.3077115913*m+0.2309699292*s), toGamma(-1.2684380046*l+2.6097574011*m-0.3413193965*s), toGamma(-0.0041960863*l-0.7034186147*m+1.707614701*s)];
  }

  function inGamut(rgb) { return rgb.every(function(c){ return c>=-0.001&&c<=1.001; }); }

  function strokeFor(color, maxL, alpha) {
    var pc=parseColor(color), r=pc[0],g=pc[1],b=pc[2];
    var lab=srgbToOklab(r,g,b), L=lab[0],A=lab[1],B=lab[2];
    if (L<=maxL) { var rgb2=[r,g,b].map(function(c){ return Math.round(c*255); }); return 'rgba('+rgb2[0]+','+rgb2[1]+','+rgb2[2]+','+alpha+')'; }
    var C=Math.hypot(A,B), hue=Math.atan2(B,A), cos=Math.cos(hue), sin=Math.sin(hue), fitted=C;
    if (!inGamut(oklabToSrgb(maxL,cos*C,sin*C))) {
      var lo=0,hi=C;
      for (var i=0;i<16;i++) { var mid=(lo+hi)/2; if(inGamut(oklabToSrgb(maxL,cos*mid,sin*mid))) lo=mid; else hi=mid; }
      fitted=lo;
    }
    var out=oklabToSrgb(maxL,cos*fitted,sin*fitted).map(function(c){ return Math.round(Math.min(1,Math.max(0,c))*255); });
    return 'rgba('+out[0]+','+out[1]+','+out[2]+','+alpha+')';
  }

  function initRibbonTrails(container, opts) {
    opts = opts || {};
    var colors      = opts.colors      || ['#cc2020','#ff4400','#111111','#888888'];
    var colorShift  = opts.colorShift  !== undefined ? opts.colorShift  : 2;
    var opacity     = opts.opacity     !== undefined ? opts.opacity     : 55;
    var thickness   = opts.thickness   !== undefined ? opts.thickness   : 2;
    var trails      = opts.trails      !== undefined ? opts.trails      : 40;
    var trailLength = opts.trailLength !== undefined ? opts.trailLength : 25;

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;display:block;';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var count   = Math.max(1, Math.round(trails));
    var palette = (colors || []).filter(Boolean).slice(0, MAX_COLORS);
    if (!palette.length) palette = ['#cc2020','#ff4400','#111111','#888888'];
    var weight  = Math.min(100, Math.max(0, opacity)) / 100;
    var fade    = Math.min(1, REFERENCE_TRAILS / count);
    var strokes = palette.map(function(entry) {
      return strokeFor(entry, MAX_STROKE_L, weight * parseColor(entry)[3] * fade);
    });

    var running = true, started = false, rafId = 0;
    var target  = { x: 0, y: 0 };
    var bornAt  = 0;
    var holdMs  = Math.max(0.1, colorShift) * 1000;
    var lines   = [];

    function buildLines() {
      lines = [];
      for (var i = 0; i < count; i++) {
        lines.push(new Line({
          spring: 0.4 + (i / count) * 0.025,
          friction: FRICTION, dampening: DAMPENING, tension: TENSION,
          size: Math.max(2, Math.round(trailLength)),
          target: target
        }));
      }
    }

    function resize() {
      canvas.width  = Math.max(1, Math.round(container.clientWidth));
      canvas.height = Math.max(1, Math.round(container.clientHeight));
    }

    function updatePosition(e) {
      var clientX, clientY;
      if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else { clientX = e.clientX; clientY = e.clientY; }
      var rect = container.getBoundingClientRect();
      var sx = rect.width  > 0 ? container.clientWidth  / rect.width  : 1;
      var sy = rect.height > 0 ? container.clientHeight / rect.height : 1;
      target.x = (clientX - rect.left) * sx;
      target.y = (clientY - rect.top)  * sy;
    }

    function loop() {
      if (!running || !ctx) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (bornAt === 0) bornAt = performance.now();
      var held = Math.floor((performance.now() - bornAt) / holdMs);
      ctx.strokeStyle = strokes[held % strokes.length];
      ctx.lineWidth   = Math.max(0.1, thickness);
      for (var i = 0; i < count; i++) {
        var line = lines[i];
        if (line) { line.update(); line.draw(ctx); }
      }
      rafId = window.requestAnimationFrame(loop);
    }

    function onFirstMove(e) {
      document.removeEventListener('mousemove', onFirstMove);
      document.removeEventListener('touchstart', onFirstMove);
      document.addEventListener('mousemove', updatePosition);
      document.addEventListener('touchmove', updatePosition, { passive: false });
      updatePosition(e);
      buildLines();
      started = true;
      loop();
    }

    document.addEventListener('mousemove', onFirstMove);
    document.addEventListener('touchstart', onFirstMove, { passive: true });

    if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
    window.addEventListener('focus', function() { if (!running) { running = true; if (started) loop(); } });
    window.addEventListener('blur',  function() { running = false; window.cancelAnimationFrame(rafId); });

    resize();
  }

  function init() {
    var section = document.getElementById('poderSection');
    if (!section) return;
    section.style.position = 'relative';
    section.style.overflow = 'hidden';
    initRibbonTrails(section, {
      colors:      ['#cc2020', '#ff4400', '#111111', '#777777'],
      colorShift:  2,
      opacity:     55,
      thickness:   2,
      trails:      40,
      trailLength: 25,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
