// learn-graph.jsx — interactive influence constellation.
// DOM nodes (crisp text) + a canvas behind for edges. Gentle drift; drag to play;
// hover/click highlights a node and its connections; click opens a detail panel.

const { useRef, useState, useEffect, useMemo } = React;

const TYPE_LABEL = { thinker: "Thinker", book: "Book", video: "Video", idea: "Idea" };
const CLUSTER_COLOR = {
  mm:   "#2B50E0",
  math: "#7A33C8",
  learn:"#1F8A5B",
  sys:  "#C0561E",
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

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, hover, selected, filter, adj]);

  const byId = (id) => data.nodes.find(n => n.id === id);
  const nodeEls = useRef({});

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
      <div className={"lg-panel" + (sel ? " open" : "")}>
        {sel && (
          <div className="lg-panel-in">
            <button className="lg-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <div className="lg-p-type" style={{ color: CLUSTER_COLOR[sel.cluster] }}>
              <span className="lg-p-mark" style={{ background: CLUSTER_COLOR[sel.cluster] }}></span>
              {TYPE_LABEL[sel.type]} · {data.clusters[sel.cluster].label}
            </div>
            <h3 className="lg-p-name">{sel.label}</h3>
            <p className="lg-p-note">{sel.note}</p>
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
