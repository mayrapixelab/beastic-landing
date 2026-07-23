// Liquid Distortion — vanilla WebGL, adapted from Originkit component
// Applied to .ph-hero-img and .split-right img automatically

(function () {
  'use strict';

  /* ─── GLSL ─── */
  var VERT = `
precision highp float;
attribute vec2 a_position;
varying vec2 vUv, vL, vR, vT, vB;
uniform vec2 u_texel;
void main(){
  vUv=.5*(a_position+1.);
  vL=vUv-vec2(u_texel.x,0.); vR=vUv+vec2(u_texel.x,0.);
  vT=vUv+vec2(0.,u_texel.y); vB=vUv-vec2(0.,u_texel.y);
  gl_Position=vec4(a_position,0.,1.);
}`;

  var FRAG_ADVECT = `
precision highp float; precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_velocity_texture, u_input_texture;
uniform vec2 u_texel, u_output_textel;
uniform float u_dt, u_dissipation;
vec4 bilerp(sampler2D s,vec2 uv,vec2 t){
  vec2 st=uv/t-.5, iuv=floor(st), fuv=fract(st);
  vec4 a=texture2D(s,(iuv+vec2(.5,.5))*t), b=texture2D(s,(iuv+vec2(1.5,.5))*t);
  vec4 c=texture2D(s,(iuv+vec2(.5,1.5))*t), d=texture2D(s,(iuv+vec2(1.5,1.5))*t);
  return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);
}
void main(){
  vec2 coord=vUv-u_dt*bilerp(u_velocity_texture,vUv,u_texel).xy*u_texel;
  gl_FragColor=u_dissipation*bilerp(u_input_texture,coord,u_output_textel);
}`;

  var FRAG_DIVERGENCE = `
precision highp float; precision highp sampler2D;
varying highp vec2 vUv, vL, vR, vT, vB;
uniform sampler2D u_velocity_texture;
void main(){
  float L=texture2D(u_velocity_texture,vL).x, R=texture2D(u_velocity_texture,vR).x;
  float T=texture2D(u_velocity_texture,vT).y, B=texture2D(u_velocity_texture,vB).y;
  gl_FragColor=vec4(.25*(R-L+T-B),0.,0.,1.);
}`;

  var FRAG_PRESSURE = `
precision highp float; precision highp sampler2D;
varying highp vec2 vUv, vL, vR, vT, vB;
uniform sampler2D u_pressure_texture, u_divergence_texture;
void main(){
  float L=texture2D(u_pressure_texture,vL).x, R=texture2D(u_pressure_texture,vR).x;
  float T=texture2D(u_pressure_texture,vT).x, B=texture2D(u_pressure_texture,vB).x;
  float div=texture2D(u_divergence_texture,vUv).x;
  gl_FragColor=vec4((L+R+B+T-div)*.25,0.,0.,1.);
}`;

  var FRAG_GRAD_SUB = `
precision highp float; precision highp sampler2D;
varying highp vec2 vUv, vL, vR, vT, vB;
uniform sampler2D u_pressure_texture, u_velocity_texture;
void main(){
  float L=texture2D(u_pressure_texture,vL).x, R=texture2D(u_pressure_texture,vR).x;
  float T=texture2D(u_pressure_texture,vT).x, B=texture2D(u_pressure_texture,vB).x;
  vec2 vel=texture2D(u_velocity_texture,vUv).xy;
  vel.xy-=vec2(R-L,T-B);
  gl_FragColor=vec4(vel,0.,1.);
}`;

  var FRAG_POINT = `
precision highp float; precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio, u_img_ratio, u_point_size;
uniform vec3 u_point_value;
uniform vec2 u_point;
void main(){
  vec2 p=vUv-u_point.xy; p.x*=u_ratio;
  vec3 splat=.6*pow(2.,-dot(p,p)/u_point_size)*u_point_value;
  gl_FragColor=vec4(texture2D(u_input_texture,vUv).xyz+splat,1.);
}`;

  var FRAG_OUTPUT = `
precision highp float; precision highp sampler2D;
varying vec2 vUv;
uniform float u_ratio, u_img_ratio, u_disturb_power, u_canvas_scale, u_inner_scale;
uniform sampler2D u_output_texture, u_velocity_texture, u_text_texture;
uniform vec2 u_point;

vec2 get_img_uv(){
  vec2 uv=vUv-.5;
  uv*=u_canvas_scale; uv/=u_inner_scale;
  float cA=u_ratio, iA=u_img_ratio;
  vec2 sc=vec2(1.);
  if(cA>iA) sc.y=iA/cA; else sc.x=cA/iA;
  uv*=sc;
  return uv+.5;
}
vec2 get_frame_uv(){
  vec2 uv=vUv-.5;
  uv*=u_canvas_scale; uv/=u_inner_scale;
  return uv+.5;
}
float edge_alpha(vec2 uv,float w){
  float a=smoothstep(0.,w,uv.x)*smoothstep(1.,1.-w,uv.x);
  a*=smoothstep(0.,w,uv.y)*smoothstep(1.,1.-w,uv.y);
  return a;
}
vec3 sample_img(vec2 uv){
  vec2 c=clamp(uv,0.,1.);
  vec3 base=texture2D(u_text_texture,vec2(c.x,1.-c.y)).rgb;
  float oob=max(max(step(uv.y,0.),step(1.,uv.y)),max(step(uv.x,0.),step(1.,uv.x)));
  if(oob>0.){
    float d=.002; vec3 s=vec3(0.);
    for(int dy=-1;dy<=1;dy++) for(int dx=-1;dx<=1;dx++)
      s+=texture2D(u_text_texture,vec2(clamp(c.x+float(dx)*d,0.,1.),1.-clamp(c.y+float(dy)*d,0.,1.))).rgb;
    base=s/9.;
  }
  return base;
}
void main(){
  float offset=texture2D(u_output_texture,vUv).r;
  vec2 vel=texture2D(u_velocity_texture,vUv).xy+.001;
  vec2 img_uv=get_img_uv(); img_uv-=u_disturb_power*normalize(vel)*offset;
  img_uv-=u_disturb_power*normalize(vel)*offset;
  vec2 frame_uv=get_frame_uv(); frame_uv-=u_disturb_power*normalize(vel)*offset;
  vec3 img=sample_img(img_uv);
  float opacity=edge_alpha(frame_uv,.002);
  gl_FragColor=vec4(img*opacity,opacity);
}`;

  /* ─── WebGL Effect ─── */
  function LiquidEffect(canvas, container, imageSrc, opts) {
    var resolution   = opts.resolution  || 6;
    var cursorSize   = opts.cursorSize  || 50;
    var intensity    = opts.intensity   || 45;
    var innerScale   = 5 / 6;

    var gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) return;
    gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');
    gl.clearColor(0, 0, 0, 0);

    var cp = intensity / 100;
    var params = {
      cursorRadiusPx: cursorSize,
      cursorPower: 5 + ((cp - 0.1) * 45) / 0.9,
      distortionPower: cp
    };

    var res        = { w: 2, h: 2 };
    var pointer    = { x: container.clientWidth * .65, y: container.clientHeight * .5, dx: 0, dy: 0, moved: false };
    var isHovering = false;
    var imgTex     = null;
    var imgRatio   = 1;
    var rafId      = null;
    var oc, vel, dv, pres;

    // geometry (shared VBO for quad)
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
    var ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function mkShader(src, type) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    function mkProg(vs, fs) {
      var p = gl.createProgram();
      gl.attachShader(p, mkShader(vs, gl.VERTEX_SHADER));
      gl.attachShader(p, mkShader(fs, gl.FRAGMENT_SHADER));
      gl.bindAttribLocation(p, 0, 'a_position');
      gl.linkProgram(p);
      var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < n; i++) {
        var a = gl.getActiveUniform(p, i);
        if (a) u[a.name] = gl.getUniformLocation(p, a.name);
      }
      return { p: p, u: u };
    }

    function blit(target) {
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.w, target.h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
    function mkFBO(w, h) {
      gl.activeTexture(gl.TEXTURE0);
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.FLOAT, null);
      var fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        fbo: fbo, w: w, h: h,
        att: function(id){ gl.activeTexture(gl.TEXTURE0+id); gl.bindTexture(gl.TEXTURE_2D,tex); return id; }
      };
    }
    function mkDFBO(w, h) {
      var a = mkFBO(w,h), b = mkFBO(w,h);
      return {
        w:w, h:h, tx:1/w, ty:1/h,
        r:  function(){ return a; },
        ww: function(){ return b; },
        swap: function(){ var t=a; a=b; b=t; }
      };
    }

    var PR = mkProg(VERT, FRAG_POINT);
    var DR = mkProg(VERT, FRAG_DIVERGENCE);
    var PS = mkProg(VERT, FRAG_PRESSURE);
    var GR = mkProg(VERT, FRAG_GRAD_SUB);
    var AV = mkProg(VERT, FRAG_ADVECT);
    var OU = mkProg(VERT, FRAG_OUTPUT);

    function initFBOs() {
      oc   = mkDFBO(res.w, res.h);
      vel  = mkDFBO(res.w, res.h);
      dv   =  mkFBO(res.w, res.h);
      pres = mkDFBO(res.w, res.h);
    }

    function resizeCanvas() {
      var w = container.clientWidth, h = container.clientHeight;
      if (w < 2 || h < 2) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.max(2, Math.round(w * dpr));
      canvas.height = Math.max(2, Math.round(h * dpr));
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      var base = 128 + ((resolution - 1) * (512 - 128)) / 9;
      res.w = Math.max(2, Math.round(base * (w / Math.max(1,h))));
      res.h = Math.max(2, Math.round(base));
      initFBOs();
      if (imgTex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex); }
    }

    function getUV() {
      var w = container.clientWidth, h = container.clientHeight;
      return { u: pointer.x / Math.max(1,w), v: 1 - pointer.y / Math.max(1,h) };
    }

    function loadImg(src) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
        imgTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      };
      img.src = src;
    }

    function updatePointer(ex, ey) {
      pointer.moved = true;
      pointer.dx = 6 * (ex - pointer.x);
      pointer.dy = 6 * (ey - pointer.y);
      pointer.x = ex; pointer.y = ey;
    }

    function setupEvents() {
      canvas.addEventListener('mouseenter', function(){ isHovering = true; });
      canvas.addEventListener('mouseleave', function(){ isHovering = false; pointer.moved = false; });
      canvas.addEventListener('mousemove',  function(e){
        if (!isHovering) return;
        var r = container.getBoundingClientRect();
        updatePointer(e.clientX - r.left, e.clientY - r.top);
      });
      canvas.addEventListener('touchstart', function(){ isHovering = true; }, { passive: true });
      canvas.addEventListener('touchend',   function(){ isHovering = false; pointer.moved = false; }, { passive: true });
      canvas.addEventListener('touchmove',  function(e){
        isHovering = true; e.preventDefault();
        var t = e.targetTouches[0], r = container.getBoundingClientRect();
        updatePointer(t.clientX - r.left, t.clientY - r.top);
      }, { passive: false });
      var ro = new ResizeObserver(resizeCanvas);
      ro.observe(container);
    }

    function render() {
      var dt = 1/60;
      if (pointer.moved) {
        pointer.moved = false;
        var uv  = getUV();
        var cW  = container.clientWidth;
        var cH  = Math.max(1, container.clientHeight);
        var rr  = params.cursorRadiusPx / cH;

        gl.useProgram(PR.p);
        gl.uniform1i(PR.u.u_input_texture, vel.r().att(1));
        gl.uniform1f(PR.u.u_ratio, cW / cH);
        gl.uniform2f(PR.u.u_point, uv.u, uv.v);
        gl.uniform3f(PR.u.u_point_value, pointer.dx, -pointer.dy, 0);
        gl.uniform1f(PR.u.u_point_size, rr * rr);
        blit(vel.ww()); vel.swap();

        gl.uniform1i(PR.u.u_input_texture, oc.r().att(1));
        gl.uniform3f(PR.u.u_point_value, params.cursorPower * 0.001, 0, 0);
        blit(oc.ww()); oc.swap();
      }

      gl.useProgram(DR.p);
      gl.uniform2f(DR.u.u_texel, vel.tx, vel.ty);
      gl.uniform1i(DR.u.u_velocity_texture, vel.r().att(1));
      blit(dv);

      gl.useProgram(PS.p);
      gl.uniform2f(PS.u.u_texel, vel.tx, vel.ty);
      gl.uniform1i(PS.u.u_divergence_texture, dv.att(1));
      for (var i = 0; i < 16; i++) {
        gl.uniform1i(PS.u.u_pressure_texture, pres.r().att(2));
        blit(pres.ww()); pres.swap();
      }

      gl.useProgram(GR.p);
      gl.uniform2f(GR.u.u_texel, vel.tx, vel.ty);
      gl.uniform1i(GR.u.u_pressure_texture, pres.r().att(1));
      gl.uniform1i(GR.u.u_velocity_texture, vel.r().att(2));
      blit(vel.ww()); vel.swap();

      gl.useProgram(AV.p);
      gl.uniform2f(AV.u.u_texel, vel.tx, vel.ty);
      gl.uniform2f(AV.u.u_output_textel, vel.tx, vel.ty);
      gl.uniform1i(AV.u.u_velocity_texture, vel.r().att(1));
      gl.uniform1i(AV.u.u_input_texture,    vel.r().att(1));
      gl.uniform1f(AV.u.u_dt, dt);
      gl.uniform1f(AV.u.u_dissipation, 0.97);
      blit(vel.ww()); vel.swap();

      gl.uniform2f(AV.u.u_output_textel, oc.tx, oc.ty);
      gl.uniform1i(AV.u.u_input_texture, oc.r().att(2));
      gl.uniform1f(AV.u.u_dt, 8 * dt);
      gl.uniform1f(AV.u.u_dissipation, 0.98);
      blit(oc.ww()); oc.swap();

      var uv2 = getUV();
      var cW2 = container.clientWidth, cH2 = Math.max(1, container.clientHeight);
      gl.useProgram(OU.p);
      gl.uniform2f(OU.u.u_point, uv2.u, uv2.v);
      gl.uniform1i(OU.u.u_velocity_texture, vel.r().att(2));
      gl.uniform1f(OU.u.u_ratio,          cW2 / cH2);
      gl.uniform1f(OU.u.u_img_ratio,      imgRatio);
      gl.uniform1f(OU.u.u_disturb_power,  params.distortionPower);
      gl.uniform1i(OU.u.u_output_texture, oc.r().att(1));
      gl.uniform1f(OU.u.u_canvas_scale,   1);
      gl.uniform1f(OU.u.u_inner_scale,    innerScale);
      if (imgTex) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.uniform1i(OU.u.u_text_texture, 0);
      }
      blit();
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      rafId = (window.requestAnimationFrame || function(fn){ return setTimeout(fn, 16); })(render);
    }

    resizeCanvas();
    setupEvents();
    loadImg(imageSrc);
    render();
  }

  /* ─── Init helpers ─── */

  // Replace an <img> with a WebGL canvas, wrap in a positioned div
  function initOnImg(img) {
    if (!img || img.tagName !== 'IMG') return;
    var src = img.src || img.getAttribute('src');
    if (!src) return;

    function setup() {
      var r = img.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) { setTimeout(setup, 50); return; }

      // Container = the nearest positioned ancestor of the img
      var posParent = img.offsetParent || img.parentElement;
      var pr = posParent.getBoundingClientRect();

      var left = r.left - pr.left;
      var top  = r.top  - pr.top;

      var wrap = document.createElement('div');
      wrap.style.cssText =
        'position:absolute;left:' + left + 'px;top:' + top + 'px;' +
        'width:' + r.width + 'px;height:' + r.height + 'px;' +
        'overflow:hidden;pointer-events:none;z-index:1;';
      posParent.appendChild(wrap);

      var canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:auto;';
      wrap.appendChild(canvas);

      img.style.visibility = 'hidden';

      new LiquidEffect(canvas, wrap, src, { resolution: 6, cursorSize: 50, intensity: 45 });

      // Sync wrapper position on resize
      window.addEventListener('resize', function() {
        var r2  = img.getBoundingClientRect();
        var pr2 = posParent.getBoundingClientRect();
        wrap.style.left   = (r2.left - pr2.left) + 'px';
        wrap.style.top    = (r2.top  - pr2.top)  + 'px';
        wrap.style.width  = r2.width  + 'px';
        wrap.style.height = r2.height + 'px';
      });
    }

    if (img.complete && img.naturalWidth > 0) {
      setTimeout(setup, 50);
    } else {
      img.addEventListener('load', function(){ setTimeout(setup, 50); });
    }
  }

  // For images directly inside a flex/grid container — use the parent as container
  function initInContainer(img) {
    if (!img || img.tagName !== 'IMG') return;
    var src = img.src || img.getAttribute('src');
    if (!src) return;

    var container = img.parentElement;

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;min-height:inherit;pointer-events:auto;';
    container.replaceChild(canvas, img);

    new LiquidEffect(canvas, container, src, { resolution: 6, cursorSize: 50, intensity: 45 });
  }

  /* ─── Auto-initialize ─── */
  function initAll() {
    // Skip on mobile — ph-hero-img is display:none anyway
    if (window.innerWidth <= 768) return;

    // Hero side images — absolutely positioned, need wrapper
    document.querySelectorAll('.ph-hero-img').forEach(initOnImg);

    // Split section images — inside flex container, can replace directly
    document.querySelectorAll('.split-right img').forEach(initInContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
