// learn-graph.jsx — interactive influence constellation.
// DOM nodes (crisp text) + a canvas behind for edges. Gentle drift; drag to play;
// hover/click highlights a node and its connections; click opens a detail panel.

const { useRef, useState, useEffect, useMemo } = React;

const TYPE_LABEL = { thinker: "Thinker", book: "Book", video: "Video", idea: "Idea" };
const CLUSTER_COLOR = {
  arab:  "#A66A1F",
  sci:   "#138A8A",
  world: "#7A33C8",
  build: "#1F8A5B",
  live:  "#C04467",
};

function LearnGraph() {
  const data = window.LEARN;
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ w: 1000, h: 640 });
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(null); // type filter

  // live positions (px), anchors (normalized), drift phases
  const stateRef = useRef(null);
  if (!stateRef.current) {
    const m = {};
    data.nodes.forEach((n, i) => {
      m[n.id] = { ax: n.x, ay: n.y, x: 0, y: 0, ph: i * 1.7, dragging: false };
    });
    stateRef.current = m;
  }

  const adj = useMemo(() => {
    const a = {};
    data.nodes.forEach(n => (a[n.id] = new Set()));
    data.edges.forEach(([s, t]) => { a[s] && a[s].add(t); a[t] && a[t].add(s); });
    return a;
  }, []);

  // resize
  useEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // padding so nodes/labels don't clip
  const PAD_X = 130, PAD_TOP = 64, PAD_BOT = 78;
  const toPx = (ax, ay) => ({
    x: PAD_X + ax * (size.w - PAD_X * 2),
    y: PAD_TOP + ay * (size.h - PAD_TOP - PAD_BOT),
  });

  // collision relaxation: measure real label boxes and push anchors apart
  // so chips never overlap, at any viewport width. Re-runs on resize + font load.
  useEffect(() => {
    if (!size.w || !size.h) return;
    let dead = false;
    const relax = () => {
      if (dead || size.w < 480 || size.h < 320) return;
      const st = stateRef.current;
      const ids = data.nodes.map(n => n.id);
      const dims = {}, pos = {};
      for (const id of ids) {
        const el = nodeEls.current[id];
        if (!el) return;
        dims[id] = { w: el.offsetWidth, h: el.offsetHeight };
        const p = toPx(st[id].ax, st[id].ay);
        pos[id] = { x: p.x, y: p.y };
      }
      const MX = 18, MY = 14; // margin incl. drift amplitude
      const K = 0.5;           // damping — converge gently, never explode
      // cluster labels are fixed obstacles: nodes move around them
      const obstacles = [...(wrapRef.current ? wrapRef.current.querySelectorAll('.lg-cluster') : [])].map(el => {
        const w = el.offsetWidth, h = el.offsetHeight;
        const key = Object.keys(data.clusters).find(k => el.textContent.startsWith(data.clusters[k].label));
        const c = key ? data.clusters[key] : null;
        if (!c) return null;
        const p = toPx(c.lx, c.ly);
        return { x: p.x, y: p.y, w, h };
      }).filter(Boolean);
      for (let it = 0; it < 220; it++) {
        let moved = false;
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = pos[ids[i]], b = pos[ids[j]];
            const da = dims[ids[i]], db = dims[ids[j]];
            const ox = (da.w + db.w) / 2 + MX - Math.abs(a.x - b.x);
            const oy = (da.h + db.h) / 2 + MY - Math.abs(a.y - b.y);
            if (ox > 0 && oy > 0) {
              moved = true;
              if (ox < oy * 2.2) {
                const push = (ox / 2) * K * (a.x <= b.x ? -1 : 1);
                a.x += push; b.x -= push;
              } else {
                const push = (oy / 2) * K * (a.y <= b.y ? -1 : 1);
                a.y += push; b.y -= push;
              }
            }
          }
        }
        // push nodes off the (immovable) cluster labels
        for (const id of ids) {
          const a = pos[id], da = dims[id];
          for (const ob of obstacles) {
            const ox = (da.w + ob.w) / 2 + MX - Math.abs(a.x - ob.x);
            const oy = (da.h + ob.h) / 2 + MY - Math.abs(a.y - ob.y);
            if (ox > 0 && oy > 0) {
              moved = true;
              if (ox < oy * 2.2) a.x += ox * K * (a.x <= ob.x ? -1 : 1);
              else a.y += oy * K * (a.y <= ob.y ? -1 : 1);
            }
          }
        }
        // keep inside bounds DURING iteration so pushes can't compound outward
        for (const id of ids) {
          const p = pos[id], d = dims[id];
          p.x = Math.max(d.w / 2 + 8, Math.min(size.w - d.w / 2 - 8, p.x));
          p.y = Math.max(34, Math.min(size.h - 40, p.y));
        }
        if (!moved) break;
      }
      for (const id of ids) {
        const p = pos[id];
        st[id].ax = (p.x - PAD_X) / (size.w - PAD_X * 2);
        st[id].ay = (p.y - PAD_TOP) / (size.h - PAD_TOP - PAD_BOT);
      }
    };
    relax();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relax);
    return () => { dead = true; };
  }, [size]);

  // animation loop: drift + draw edges
  useEffect(() => {
    let raf;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const draw = (ts) => {
      const st = stateRef.current;
      // update positions
      data.nodes.forEach(n => {
        const s = st[n.id];
        const base = toPx(s.ax, s.ay);
        if (!s.dragging) {
          const amp = reduce ? 0 : 7;
          s.x = base.x + Math.sin(ts * 0.0004 + s.ph) * amp;
          s.y = base.y + Math.cos(ts * 0.00033 + s.ph * 1.3) * amp;
        }
        // hard clamp against the element's REAL size every frame — nothing
        // (drift, drag, stale font metrics) can push a chip past the frame edge
        const elb = nodeEls.current[n.id];
        if (elb) {
          const hw = elb.offsetWidth / 2 + 6, hh = elb.offsetHeight / 2 + 4;
          s.x = Math.max(hw, Math.min(size.w - hw, s.x));
          s.y = Math.max(hh, Math.min(size.h - hh, s.y));
        }
      });

      canvas.width = size.w * dpr; canvas.height = size.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);

      const active = hover || selected;
      const activeSet = active ? adj[active] : null;

      data.edges.forEach(([sId, tId]) => {
        const a = st[sId], b = st[tId];
        if (!a || !b) return;
        const isActive = active && (sId === active || tId === active);
        const dimmedByFilter = filter && !(matchesFilter(byId(sId), filter) && matchesFilter(byId(tId), filter));
        ctx.beginPath();
        // gentle curve
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 14;
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        if (isActive) { ctx.strokeStyle = "rgba(43,80,224,0.55)"; ctx.lineWidth = 1.6; }
        else if (active || dimmedByFilter) { ctx.strokeStyle = "rgba(21,20,15,0.05)"; ctx.lineWidth = 1; }
        else { ctx.strokeStyle = "rgba(21,20,15,0.12)"; ctx.lineWidth = 1; }
        ctx.stroke();
      });

      // sync DOM node positions
      data.nodes.forEach(n => {
        const s = st[n.id];
        const elc = nodeEls.current[n.id];
        if (elc) elc.style.transform = `translate(-50%,-50%) translate(${s.x}px, ${s.y}px)`;
      });

      // slide the detail panel from the rAF loop too — CSS transitions can be
      // frozen in embedded preview hosts, so the visible end state must never
      // depend on one. Eased here; reduced motion snaps.
      const pa = panelAnim.current;
      const target = selected ? 1 : 0;
      pa.p = reduce ? target : pa.p + (target - pa.p) * 0.16;
      if (Math.abs(target - pa.p) < 0.002) pa.p = target;
      if (panelRef.current) panelRef.current.style.transform = `translateX(${((1 - pa.p) * 102).toFixed(2)}%)`;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, hover, selected, filter, adj]);

  const byId = (id) => data.nodes.find(n => n.id === id);
  const nodeEls = useRef({});
  const panelRef = useRef(null);
  const panelAnim = useRef({ p: 0 });

  // dragging
  const drag = useRef(null);
  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const s = stateRef.current[drag.current];
      s.x = px; s.y = py;
      // update anchor so it stays put after release
      s.ax = (px - PAD_X) / (size.w - PAD_X * 2);
      s.ay = (py - PAD_TOP) / (size.h - PAD_TOP - PAD_BOT);
    };
    const onUp = () => {
      if (drag.current) { stateRef.current[drag.current].dragging = false; drag.current = null; }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [size]);

  function matchesFilter(n, f) { return !f || n.type === f; }

  const active = hover || selected;
  const sel = selected ? byId(selected) : null;

  return (
    <div className="lg-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="lg-canvas" style={{ width: size.w, height: size.h }} />

      {/* cluster labels */}
      {Object.entries(data.clusters).map(([key, c]) => {
        const p = toPx(c.lx, c.ly);
        return (
          <div key={key} className="lg-cluster" style={{
            left: p.x, top: p.y, color: CLUSTER_COLOR[key]
          }}>
            <span className="lg-cluster-dot" style={{ background: CLUSTER_COLOR[key] }}></span>
            {c.label}<span className="lg-cluster-sub"> · {c.short}</span>
          </div>
        );
      })}

      {/* nodes */}
      {data.nodes.map(n => {
        const isActive = active === n.id;
        const isNeighbor = active && adj[active] && adj[active].has(n.id);
        const dimmed = (active && !isActive && !isNeighbor) || (filter && n.type !== filter);
        const cls = [
          "lg-node", `t-${n.type}`, n.hub ? "hub" : "",
          isActive ? "active" : "", isNeighbor ? "neighbor" : "", dimmed ? "dim" : "",
          selected === n.id ? "selected" : ""
        ].join(" ");
        return (
          <button key={n.id} className={cls}
            ref={el => (nodeEls.current[n.id] = el)}
            style={{ "--c": CLUSTER_COLOR[n.cluster] }}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setSelected(selected === n.id ? null : n.id)}
            onMouseDown={(e) => {
              drag.current = n.id; stateRef.current[n.id].dragging = true;
              const r = wrapRef.current.getBoundingClientRect();
              const s = stateRef.current[n.id];
              s.x = e.clientX - r.left; s.y = e.clientY - r.top;
            }}
          >
            <span className="lg-dot"></span>
            <span className="lg-label">{n.label}</span>
          </button>
        );
      })}

      {/* legend / type filter */}
      <div className="lg-legend">
        <span className="lg-legend-k">filter</span>
        {["thinker","book","video","idea"].map(t => (
          <button key={t} className={"lg-leg-btn" + (filter === t ? " on" : "")}
            onClick={() => setFilter(filter === t ? null : t)}>
            <span className={"lg-leg-mark m-" + t}></span>{TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="lg-hint">drag a node to play · click to read</div>

      {/* detail panel */}
      <div className={"lg-panel" + (sel ? " open" : "")} ref={panelRef}>
        {sel && (
          <div className="lg-panel-in">
            <button className="lg-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <div className="lg-p-type" style={{ color: CLUSTER_COLOR[sel.cluster] }}>
              <span className="lg-p-mark" style={{ background: CLUSTER_COLOR[sel.cluster] }}></span>
              {TYPE_LABEL[sel.type]} · {data.clusters[sel.cluster].label}
            </div>
            <h3 className="lg-p-name">{sel.label}</h3>
            <p className="lg-p-note">{sel.note}</p>
            {sel.url && (
              <a className="lg-p-link" href={sel.url} target="_blank" rel="noopener noreferrer">Visit channel <span className="arr">↗</span></a>
            )}
            <div className="lg-p-conn-k">Connected to</div>
            <div className="lg-p-conn">
              {[...adj[sel.id]].map(id => (
                <button key={id} className="lg-chip" onClick={() => setSelected(id)}>{byId(id).label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LearnGraph });
