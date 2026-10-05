import * as THREE from 'three';
import * as P from './products.js';

/* ============ Datos y utilidades ============ */
const products = P.products, config = P.config || {};
const CUR = config.currency || 'Bs', WA = config.whatsapp || '';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const fmt = (n) => `${n} ${CUR}`;
const TRI = Math.max(0, products.findIndex((p) => p.id === 'la-tri'));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ Título que se corta (letras divididas en dos mitades) ============ */
const hero = $('#home'), heroContent = $('.hero-content'), title = $('#heroTitle');
title.innerHTML = ['TRISMASH', 'BURGER'].map((w, wi) =>
  `<span class="word${wi ? ' alt' : ''}">${[...w].map((ch) => `<span class="cut-letter">${ch}<span class="half l" aria-hidden="true">${ch}</span><span class="half r" aria-hidden="true">${ch}</span><i class="cut-line"></i></span>`).join('')}</span>`).join('');
title.setAttribute('aria-label', 'TRISMASH BURGER');
const letters = $$('.cut-letter', title), N = letters.length;
const cutState = letters.map(() => ({ c: -1, f: -1 }));

/* ============ Catálogo ============ */
let cur = TRI, size = 'doble', autoTimer = null, live = false;
const E = { img: $('#catalogBurger'), num: $('#catalogNumber'), name: $('#catalogName'), desc: $('#catalogDescription'),
  price: $('#catalogPrice'), counter: $('#currentNumber'), box: $('#catalogBox'), tilt: $('#burgerTilt'), info: $('#catalogInfo'),
  dots: $('#catalogDots'), thumbs: $('#catalogThumbs'), flash: $('#catalogFlash'), shadow: $('.catalog-shadow') };
E.dots.innerHTML = products.map((p, i) => `<button class="dot" data-i="${i}" type="button" aria-label="${p.name}"></button>`).join('');
E.thumbs.innerHTML = products.map((p, i) => `<button class="thumb" data-i="${i}" type="button"><img src="${p.image}" alt=""><span>${p.name}</span></button>`).join('');
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
function syncPrice() { E.price.textContent = products[cur].prices[size]; $$('.size-option').forEach((b) => b.classList.toggle('active', b.dataset.size === size)); }
function show(i, dir = 1) {
  cur = (i + products.length) % products.length; const p = products[cur];
  E.img.src = p.image; E.img.alt = p.name; E.img.style.setProperty('--dir', dir); restart(E.img, 'swap'); restart(E.info, 'swap');
  E.num.textContent = p.numeral; E.name.textContent = p.name; E.desc.textContent = p.description;
  E.counter.textContent = String(cur + 1).padStart(2, '0'); syncPrice();
  $$('.dot').forEach((d, k) => d.classList.toggle('active', k === cur)); $$('.thumb').forEach((d, k) => d.classList.toggle('active', k === cur));
}
const go = (i, dir) => { show(i, dir); startAuto(); };
function startAuto() { clearInterval(autoTimer); if (live && !reduce) autoTimer = setInterval(() => { if (!document.hidden) show(cur + 1, 1); }, 7000); }
$('#prevProduct').onclick = () => go(cur - 1, -1); $('#nextProduct').onclick = () => go(cur + 1, 1);
E.dots.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) go(+b.dataset.i, +b.dataset.i > cur ? 1 : -1); };
E.thumbs.onclick = E.dots.onclick;
$$('.size-option').forEach((b) => b.onclick = () => { size = b.dataset.size; syncPrice(); });
$('#orderProduct').onclick = () => addToCart(products[cur].id, size);
show(TRI, 1);

/* Inclinación 3D de la foto del catálogo (mouse y táctil) */
E.box.addEventListener('pointermove', (e) => {
  const r = E.box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5, d = Math.min(Math.hypot(x, y) * 1.4, 1);
  E.tilt.style.transform = `rotateY(${x * 28}deg) rotateX(${-y * 22}deg) translate3d(${x * 26}px,${y * 18}px,${60 - d * 30}px) scale(${1.05 - d * .04})`;
  E.shadow.style.transform = `translate(${-x * 70}px,0) scaleX(${1 - d * .25})`;
});
['pointerleave', 'pointerup', 'pointercancel'].forEach((ev) => E.box.addEventListener(ev, () => { E.tilt.style.transform = ''; E.shadow.style.transform = ''; }));

/* ============ Carrito ============ */
let cart = []; try { cart = JSON.parse(localStorage.getItem('tsb-cart') || '[]'); } catch {}
let toastT; const toast = (m) => { $('#toastText').textContent = m; const t = $('#toast'); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1900); };
function addToCart(id, sz) {
  const it = cart.find((c) => c.id === id && c.size === sz); it ? it.qty++ : cart.push({ id, size: sz, qty: 1 });
  renderCart(); toast(`${products.find((p) => p.id === id).name} (${sz}) agregada`); restart($('#cartButton'), 'bump');
}
function rows() { return cart.map((c, i) => { const p = products.find((x) => x.id === c.id); return p ? { ...c, i, p, price: p.prices[c.size] } : null; }).filter(Boolean); }
function renderCart() {
  try { localStorage.setItem('tsb-cart', JSON.stringify(cart)); } catch {}
  const r = rows(), total = r.reduce((t, x) => t + x.price * x.qty, 0);
  $('#cartCount').textContent = r.reduce((t, x) => t + x.qty, 0);
  $('#cartItems').innerHTML = r.length ? r.map((x) => `<div class="cart-item"><img src="${x.p.image}" alt="">
    <div><strong>${x.p.name}</strong><small>${x.size.toUpperCase()} · ${fmt(x.price)}</small>
    <div class="qty"><button data-a="dec" data-i="${x.i}" type="button" aria-label="Menos">−</button><span>${x.qty}</span><button data-a="inc" data-i="${x.i}" type="button" aria-label="Más">+</button></div></div>
    <div><button class="rm" data-a="rm" data-i="${x.i}" type="button" aria-label="Eliminar">×</button><div class="line-total">${fmt(x.price * x.qty)}</div></div></div>`).join('')
    : '<p class="cart-empty">Tu pedido está vacío. Elige una burger del menú.</p>';
  $('#cartSubtotal').textContent = fmt(total); $('#cartTotal').textContent = fmt(total); $('#checkoutButton').disabled = !r.length;
}
$('#cartItems').onclick = (e) => { const b = e.target.closest('[data-a]'); if (!b) return; const i = +b.dataset.i;
  if (b.dataset.a === 'inc') cart[i].qty++; if (b.dataset.a === 'dec') cart[i].qty = Math.max(1, cart[i].qty - 1); if (b.dataset.a === 'rm') cart.splice(i, 1); renderCart(); };
$('#checkoutButton').onclick = () => {
  const r = rows(), total = r.reduce((t, x) => t + x.price * x.qty, 0);
  if (!WA) return toast('Configura tu WhatsApp en src/products.js');
  const msg = `Hola Trismash! Quiero pedir:\n${r.map((x) => `${x.qty} x ${x.p.name} (${x.size}) - ${fmt(x.price * x.qty)}`).join('\n')}\nTotal: ${fmt(total)}`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');
};
const cartOpen = (v) => document.body.classList.toggle('cart-open', v);
$('#cartButton').onclick = () => cartOpen(true); $('#closeCart').onclick = () => cartOpen(false); $('#cartOverlay').onclick = () => cartOpen(false);
addEventListener('keydown', (e) => e.key === 'Escape' && cartOpen(false));
renderCart();

/* ============ Escena 3D (UN solo sistema controla la hamburguesa voladora) ============ */
const canvas = $('#webgl');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace; else renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 10, 6000);
let W = innerWidth, H = innerHeight, hr = 1, arrive = 2, centers = [], anchor = { x: 0, docY: 0, w: 300, h: 220 }, burgerW = 160, S = { x: 0, y: 0 }, X = { x: 0, y: 0 };
let burger = null, glow = null, rings = [], aspect = 1.345;
const mkTex = (img) => { const t = new THREE.CanvasTexture(img); if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t; };
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,200,255,.95)'); gr.addColorStop(.35, 'rgba(255,43,214,.45)'); gr.addColorStop(.7, 'rgba(139,61,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return mkTex(c); })();

/* Fondo: estrellas + formas wireframe con parallax */
const bg = new THREE.Group(); scene.add(bg);
{ const n = 700, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), pal = [[1, 1, 1], [.55, .24, 1], [1, .17, .84], [1, .82, .25]];
  for (let i = 0; i < n; i++) { pos.set([Math.random() * 2 - 1, Math.random() * 2 - 1, -Math.random()], i * 3); col.set(pal[(Math.random() * pal.length) | 0], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  bg.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .8 }))); }
const shapes = [[new THREE.IcosahedronGeometry(1, 1), 0x8b3dff, -.78, .45, .28], [new THREE.OctahedronGeometry(1, 0), 0xff2bd6, .8, -.2, .4], [new THREE.TorusGeometry(1, .35, 12, 32), 0xffd23f, -.82, -.7, .34], [new THREE.IcosahedronGeometry(1, 0), 0xff2bd6, .7, .9, .22]]
  .map(([g, c, fx, fy, f]) => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: .35 })); scene.add(m); return { m, fx, fy, f }; });

/* Hamburguesa: foto real apilada en capas para dar grosor 3D + glow + anillos + estela */
new THREE.TextureLoader().load(products[TRI].image, (tex) => {
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace; else tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); aspect = tex.image.width / tex.image.height;
  burger = new THREE.Group(); scene.add(burger);
  glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.setScalar(2.5); glow.position.z = -.3; burger.add(glow);
  for (let i = 9; i >= 0; i--) {
    const front = i === 0, m = new THREE.MeshBasicMaterial({ map: tex, transparent: front, alphaTest: front ? .02 : .5, depthWrite: !front, color: front ? 0xffffff : 0x5a2a80 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1 / aspect), m); mesh.position.z = -i * .013; mesh.renderOrder = front ? 10 : 0; burger.add(mesh);
  }
  [[.64, .006, 0xff2bd6], [.72, .004, 0xffd23f]].forEach(([r, t, c], k) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.z = -.12; ring.userData.k = k; burger.add(ring); rings.push(ring); });
  resize();
});
/* Estela de luz */
const TR = 46, trPos = new Float32Array(TR * 3), trCol = new Float32Array(TR * 3);
for (let i = 0; i < TR; i++) { const f = 1 - i / TR; trCol.set([f, f * .25, f * .85], i * 3); }
const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trG.setAttribute('color', new THREE.BufferAttribute(trCol, 3));
const trail = new THREE.Points(trG, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); trail.frustumCulled = false; scene.add(trail);

/* ============ Medidas (se recalculan al cambiar el tamaño) ============ */
function measure() {
  const sy = scrollY; hr = Math.max(1, hero.offsetHeight - H); const over = Math.max(0, sy - hr);
  centers = letters.map((l) => { const r = l.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 + over, w: r.width, h: r.height }; });
  const gap = clamp(centers[0].w * (W < 700 ? .2 : .3), 4, 42); letters.forEach((l) => l.style.setProperty('--gap', gap + 'px'));
  burgerW = clamp(centers[0].h * 1.7, 96, 230);
  const b = E.box.getBoundingClientRect(); anchor = { x: b.left + b.width / 2, docY: b.top + sy + b.height / 2, w: b.width, h: b.height };
  arrive = Math.max(hr + H * 1.2, anchor.docY - H / 2);
  S = { x: W * .5, y: Math.max(H * .22, centers[0].y - H * .26) }; X = { x: W * (W < 700 ? .72 : .78), y: H * .76 };
}
function resize() {
  W = innerWidth; H = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.position.z = (H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); camera.updateProjectionMatrix();
  bg.scale.set(W * .62, H * .62, 1100); bg.position.z = -100; shapes.forEach((s) => s.m.scale.setScalar(Math.min(W, H) * (s.f * .2)));
  measure();
}
addEventListener('resize', resize); addEventListener('load', measure); document.fonts && document.fonts.ready.then(measure);

/* ============ Bucle de animación ============ */
let scrollS = scrollY, mx = 0, my = 0, mxS = 0, myS = 0, wasLive = false;
addEventListener('pointermove', (e) => { mx = e.clientX / W * 2 - 1; my = e.clientY / H * 2 - 1; });
const A = .15, BE = .9;
function frame(t) {
  requestAnimationFrame(frame); t *= .001;
  scrollS = reduce ? scrollY : scrollS + (scrollY - scrollS) * .085; if (Math.abs(scrollY - scrollS) < .1) scrollS = scrollY;
  mxS += (mx - mxS) * .06; myS += (my - myS) * .06;
  const sy = scrollS, t1 = clamp(sy / hr), a = clamp(t1 / A), c = centers; if (!c.length) return;
  const wp = clamp((t1 - A) / (BE - A)) * (N + .4) - .3, wi = clamp(wp, 0, N - 1);
  const u = sy > hr ? clamp((sy - hr) / Math.max(1, arrive - hr)) : 0, fly = 1 - ease(clamp((u - .85) / .15));

  /* --- cortes de letras: cada letra se parte cuando la hamburguesa pasa por ella --- */
  heroContent.style.setProperty('--p', t1.toFixed(3));
  letters.forEach((l, i) => {
    const cv = u > 0 ? 1 : ease(clamp(wp - i + .3)), fl = cv > 0 && cv < 1 ? Math.pow(Math.sin(Math.PI * cv), .7) : 0, s = cutState[i];
    if (Math.abs(cv - s.c) > .002) { l.style.setProperty('--cut', cv.toFixed(3)); s.c = cv; }
    if (Math.abs(fl - s.f) > .005) { l.style.setProperty('--flash', fl.toFixed(3)); s.f = fl; }
  });

  /* --- trayectoria de la hamburguesa --- */
  let x, y, s = burgerW, spin = Math.PI * 2, wob = 0;
  if (t1 < A) { const k = easeOut(a), R = (1 - k) * Math.min(W, H) * .16, an = k * Math.PI * 2.4;
    x = lerp(S.x, c[0].x, k) + Math.sin(an) * R; y = lerp(S.y, c[0].y, k) + (1 - Math.cos(an)) * R * .6; s = burgerW * lerp(.6, 1, k); spin = k * Math.PI * 2; }
  else if (t1 <= BE) { const i0 = Math.floor(wi), f = wi - i0, i1 = Math.min(i0 + 1, N - 1);
    x = lerp(c[i0].x, c[i1].x, ease(f)); y = lerp(c[i0].y, c[i1].y, ease(f)) + Math.sin(wp * 1.3) * c[0].h * .1; wob = Math.sin(wp * .8) * .5; }
  else { const k = ease((t1 - BE) / (1 - BE)); x = lerp(c[N - 1].x, X.x, k); y = lerp(c[N - 1].y, X.y, k); wob = .3 * (1 - k); }
  if (u > 0) { const k = ease(u), ax = anchor.x, ay = anchor.docY - scrollY, aw = .92 * Math.min(anchor.w, anchor.h * aspect), R = Math.min(W, H) * .14 * Math.sin(Math.PI * u), an = u * Math.PI * 3;
    x = lerp(X.x, ax, k) + Math.sin(an) * R; y = lerp(X.y, ay, k) + Math.cos(an) * R * .5; s = lerp(burgerW, aw, k); spin = Math.PI * 2 + k * Math.PI * 2; wob = 0; }
  y += Math.sin(t * 1.6) * 6 * fly;

  /* --- aplicar a la escena --- */
  const arrived = u >= .999; if (arrived && !wasLive) onArrive(); if (!arrived && wasLive) onLeave(); wasLive = arrived;
  if (burger) {
    burger.visible = !arrived; burger.position.set(x - W / 2 + mxS * 14 * fly, H / 2 - y - myS * 10 * fly, 0); burger.scale.setScalar(s);
    burger.rotation.set(.22 * fly * Math.sin(t * .9 + 1) - myS * .22 * fly + .1 * Math.sin(wp) * fly, spin + (wob + Math.sin(t * .8) * .12) * fly + mxS * .35 * fly, Math.sin(t * .7) * .06 * fly + Math.sin(wp * .7) * .1 * fly);
    glow.material.opacity = .6 + .2 * Math.sin(t * 2.2); rings.forEach((r) => { r.rotation.x = Math.PI / 2.4 + Math.sin(t + r.userData.k) * .4; r.rotation.y = t * (r.userData.k ? -.9 : .7); });
    for (let i = TR - 1; i > 0; i--) trPos.copyWithin(i * 3, (i - 1) * 3, (i - 1) * 3 + 3); trPos.set([burger.position.x, burger.position.y, -6], 0); trG.attributes.position.needsUpdate = true; trail.visible = !arrived;
  }
  bg.rotation.y = t * .02 + mxS * .08; bg.rotation.x = myS * .05; bg.position.y = sy * .06;
  const R2 = H * 1.7; shapes.forEach((o, k) => { o.m.position.set(o.fx * W * .5 + mxS * 20 * (k + 1), (((o.fy * H * .5 - sy * o.f * .5) % R2) + R2 * 1.5) % R2 - R2 / 2, -300 - k * 120); o.m.rotation.x = t * (.2 + k * .06); o.m.rotation.y = t * (.28 - k * .04); });
  renderer.render(scene, camera);
}
function onArrive() { live = true; if (cur !== TRI) show(TRI, 1); E.box.classList.add('live'); restart(E.flash, 'go'); startAuto(); }
function onLeave() { live = false; E.box.classList.remove('live'); clearInterval(autoTimer); }
resize(); requestAnimationFrame(frame);
