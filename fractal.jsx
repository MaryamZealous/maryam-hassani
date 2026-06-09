// fractal.jsx — recursive branching-tree fractal on canvas.
// Echoes the thinkers node-map: branches fork, leaf tips become small nodes.
// One init per <canvas>; gentle sway + grow-in intro; respects reduced-motion.

function initFractal(canvas, cfg) {
  const c = Object.assign({
    rx: 0.5, ry: 0.98,      // root position (fraction of w/h)
    tilt: 0,                // root angle offset from straight up
    len: 0.30,              // base branch length (fraction of h)
    depth: 10,
    width: 2.2,
    ratio: 0.76,            // child length multiplier
    spread: 0.40,           // half-angle between children
    sway: 0.06,             // sway amplitude (radians)
    seed: 0,
    leafDot: true,
    color: (d) => `rgba(21,20,15,${0.05 + (1 - d / 10) * 0.10})`,
    dotColor: 'rgba(21,20,15,0.16)',
  }, cfg);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, t0 = null, running = true;

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    canvas.width = Math.max(1, w * dpr);
    canvas.height = Math.max(1, h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function branch(x, y, angle, depth, len, width, ts) {
    if (depth <= 0 || len < 1.2) {
      if (c.leafDot && depth <= 0) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.1, c.width * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = c.dotColor;
        ctx.fill();
      }
      return;
    }
    const wobble = Math.sin(ts * 0.00035 + depth * 0.7 + c.seed) * c.sway * (1 - depth / c.depth * 0.35);
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = Math.max(0.4, width);
    ctx.strokeStyle = c.color(depth);
    ctx.lineCap = 'round';
    ctx.stroke();
    const s = c.spread + wobble;
    // slight asymmetry keeps it organic rather than mechanically symmetric
    branch(x2, y2, angle - s * 1.04, depth - 1, len * c.ratio, width * 0.72, ts);
    branch(x2, y2, angle + s * 0.96, depth - 1, len * c.ratio, width * 0.72, ts);
  }

  function render(ts) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (t0 === null) t0 = ts;
    const elapsed = ts - t0;
    const grow = Math.min(1, elapsed / 1700);
    const ge = 1 - Math.pow(1 - grow, 3); // easeOutCubic
    const rootX = w * c.rx, rootY = h * c.ry;
    const baseLen = h * c.len * (0.18 + 0.82 * ge);
    branch(rootX, rootY, -Math.PI / 2 + c.tilt, c.depth, baseLen, c.width, ts);
  }

  function loop(ts) {
    if (!running) return;
    render(ts);
    raf = requestAnimationFrame(loop);
  }

  resize();
  if (reduce) {
    t0 = 0;
    render(2200); // a settled, fully-grown still frame
  } else {
    raf = requestAnimationFrame(loop);
  }
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

function Fractal({ cfg, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    // let layout settle so clientWidth/Height are correct inside the artboard
    const id = requestAnimationFrame(() => {
      if (ref.current) ref.current.__stop = initFractal(ref.current, cfg);
    });
    return () => {
      cancelAnimationFrame(id);
      if (ref.current && ref.current.__stop) ref.current.__stop();
    };
  }, []);
  return <canvas ref={ref} className={className || 'fractal'} />;
}

Object.assign(window, { initFractal, Fractal, initFractalMode });

// ---- Fractal Mode: dim the page, cursor becomes a living fractal --------
// Vanilla (no React events) so it fires reliably. Wire a trigger button:
//   const cleanup = initFractalMode(buttonEl)
function initFractalMode(buttonEl) {
  const host = buttonEl.closest('.lp') || document.body;
  let overlay = null, canvas = null, ctx = null, raf = 0;
  const cur = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let docListeners = [];

  function toLocal(e) {
    const r = overlay.getBoundingClientRect();
    const sx = r.width / overlay.offsetWidth || 1;
    const sy = r.height / overlay.offsetHeight || 1;
    return { x: (e.clientX - r.left) / sx, y: (e.clientY - r.top) / sy };
  }

  function branch(x, y, ang, depth, len, w, t, d0) {
    if (depth <= 0 || len < 2) return;
    const sway = Math.sin(t * 0.001 + depth * 0.8 + ang * 1.7) * 0.16 * (depth / d0);
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
    ctx.lineWidth = Math.max(0.6, w);
    // trunk = warm white, tips = royal blue
    const f = depth / d0, m = 1 - f;
    const r = Math.round(248 - 205 * m), g = Math.round(246 - 166 * m), b = Math.round(240 - 16 * m);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.26 + 0.5 * f})`;
    ctx.lineCap = 'round'; ctx.stroke();
    const s = 0.46 + sway;
    branch(x2, y2, ang - s * 1.05, depth - 1, len * 0.73, w * 0.72, t, d0);
    branch(x2, y2, ang + s * 0.95, depth - 1, len * 0.73, w * 0.72, t, d0);
  }

  function render(ts) {
    cur.x += (target.x - cur.x) * 0.16;
    cur.y += (target.y - cur.y) * 0.16;
    const w = overlay.clientWidth, h = overlay.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const arms = 6, d0 = 9;
    const pulse = 1 + Math.sin(ts * 0.0015) * 0.07;
    const baseLen = 112 * pulse;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 + ts * 0.00016;
      branch(cur.x, cur.y, a, d0, baseLen, 3.4, ts, d0);
    }
    ctx.save();
    ctx.shadowColor = 'rgba(248,246,240,.9)'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(cur.x, cur.y, 3.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(248,246,240,.95)'; ctx.fill();
    ctx.restore();
    raf = requestAnimationFrame(render);
  }

  function resize() {
    const w = overlay.clientWidth, h = overlay.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function open() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'fm-overlay';
    overlay.innerHTML =
      '<canvas class="fm-canvas"></canvas>' +
      '<div class="fm-caption"><div class="fm-k">what is a fractal?</div>' +
      '<p class="fm-t">A shape that repeats itself at every scale \u2014 one rule, branching forever. <b>Move your cursor.</b> Feel it grow.</p>' +
      '<span class="fm-formula">z \u21a6 z\u00b2 + c</span></div>' +
      '<div class="fm-exit">move \u00b7 click anywhere or esc to exit</div>';
    host.appendChild(overlay);
    buttonEl.classList.add('on');
    canvas = overlay.querySelector('.fm-canvas');
    ctx = canvas.getContext('2d');
    resize();
    cur.x = target.x = overlay.clientWidth / 2;
    cur.y = target.y = overlay.clientHeight / 2;
    const onMove = (e) => { const p = toLocal(e); target.x = p.x; target.y = p.y; };
    overlay.addEventListener('mousemove', onMove);
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    docListeners = [onResize, onKey];
    // delay click-to-close so the opening click doesn't immediately dismiss
    setTimeout(() => { if (overlay) overlay.addEventListener('click', close); }, 60);
    raf = requestAnimationFrame(render);
  }

  function close() {
    if (!overlay) return;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', docListeners[0]);
    document.removeEventListener('keydown', docListeners[1]);
    overlay.remove();
    overlay = null;
    buttonEl.classList.remove('on');
  }

  buttonEl.addEventListener('click', (e) => { e.preventDefault(); open(); });
  return close;
}
