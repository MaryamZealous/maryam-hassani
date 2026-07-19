// homepages.jsx — three homepage directions in a DesignCanvas.
// Shared monologue copy; each direction differs in type + composition.

const COPY = {
  sig: 'maryam hassani',
  meta: 'abu dhabi · systems & decisions',
  leadQuote: 'You are what you consume',
  leadTail: ' — what you read, build, put in your body, and give your attention to.',
  p1: 'The most interesting problems are complex by nature. They need a creative and empathetic approach and they never stay in their lane. I am a builder at heart, and I learn by doing.',
  p2: 'For me that means deliberate, relentless learning and creation. Not just what to think about, but how. Mental models, mathematical reasoning, the science of learning itself. This page is me holding myself to that, documented as I go.',
  p3: "If you happened to land here, hello. You're reading my inner monologue. Hope you find something worth taking with you.",
  learnSub: 'the thinkers, books, and ideas that shape how I reason — as a map',
  buildSub: "systems I'm making, starting with the resilience intelligence system",
  foot: 'you are what you consume',
};

// link targets — pages we build next; kept inert in the comparison canvas
const LEARN_HREF = 'learn.html';
const BUILD_HREF = 'build.html';

/* ---------------- A · NATIVE MONO ---------------- */
function HomeA() {
  return (
    <div className="lp">
      <Fractal cfg={{ rx: 0.74, ry: 1.0, tilt: 0.05, len: 0.30, depth: 10, width: 2.0, spread: 0.42, sway: 0.05,
        color: (d) => `rgba(21,20,15,${0.04 + (1 - d / 10) * 0.07})`, dotColor: 'rgba(21,20,15,0.12)' }} />
      <div className="lp-top">
        <div className="lp-sig">{COPY.sig}</div>
        <div className="lp-meta">{COPY.meta}</div>
      </div>
      <div className="lp-rule"></div>
      <div className="a-body">
        <div>
          <p className="a-lead">
            <span className="q">“{COPY.leadQuote}”</span>
            <span className="tail">{COPY.leadTail}</span>
          </p>
          <p className="a-p">{COPY.p1}</p>
          <p className="a-p">{COPY.p2}</p>
          <p className="a-p dim">{COPY.p3}</p>
        </div>
        <div className="a-right">
          <div className="a-rk">where to</div>
          <a className="navlink" href={LEARN_HREF}>
            <div className="nl-row"><span className="nl-k">Learn</span><span className="nl-arrow">→</span></div>
            <div className="nl-sub">{COPY.learnSub}</div>
          </a>
          <a className="navlink" href={BUILD_HREF}>
            <div className="nl-row"><span className="nl-k">Build</span><span className="nl-arrow">→</span></div>
            <div className="nl-sub">{COPY.buildSub}</div>
          </a>
        </div>
      </div>
      <div className="lp-foot">
        <span>{COPY.foot}</span>
        <span><span className="dot"></span>documented as I go</span>
      </div>
    </div>
  );
}

/* ---------------- B · EDITORIAL SANS ---------------- */
function HomeB() {
  return (
    <div className="lp b-lp">
      <div className="lp-top">
        <div className="lp-sig" style={{ fontFamily: 'var(--mono)' }}>{COPY.sig}</div>
        <div className="lp-meta">est. 2026</div>
      </div>
      <div className="lp-rule"></div>
      <div className="b-body">
        <div>
          <div className="b-eyebrow">inner monologue</div>
          <h1 className="b-lead">You are what<br />you consume<span className="amp">.</span></h1>
          <p className="b-sub">What you read, build, put in your body, and give your attention to.</p>
          <p className="b-p">{COPY.p1}</p>
          <p className="b-p dim">{COPY.p2}</p>
          <div className="b-cta">
            <a className="navlink" href={LEARN_HREF}>
              <div className="nl-row"><span className="nl-k">Learn</span><span className="nl-arrow">→</span></div>
              <div className="nl-sub">{COPY.learnSub}</div>
            </a>
            <a className="navlink" href={BUILD_HREF}>
              <div className="nl-row"><span className="nl-k">Build</span><span className="nl-arrow">→</span></div>
              <div className="nl-sub">{COPY.buildSub}</div>
            </a>
          </div>
        </div>
        <div className="b-stage">
          <div className="b-frame">
            <Fractal cfg={{ rx: 0.5, ry: 0.99, tilt: 0, len: 0.42, depth: 11, width: 2.4, spread: 0.40, sway: 0.045,
              color: (d) => `rgba(21,20,15,${0.10 + (1 - d / 11) * 0.30})`, dotColor: 'rgba(21,20,15,0.42)' }} />
            <div className="b-flabel">influence, branching</div>
            <div className="b-fcount">∞</div>
          </div>
        </div>
      </div>
      <div className="lp-foot">
        <span>{COPY.foot}</span>
        <span>hello, if you landed here</span>
      </div>
    </div>
  );
}

/* ---------------- C · FRACTAL HERO ---------------- */
function HomeC() {
  const fbtn = React.useRef(null);
  React.useEffect(() => {
    if (fbtn.current) return initFractalMode(fbtn.current);
  }, []);
  return (
    <div className="lp c-lp">
      <Fractal cfg={{ rx: 0.5, ry: 1.03, tilt: 0, len: 0.37, depth: 10, width: 2.0, ratio: 0.74, spread: 0.38, sway: 0.045, leafDot: false,
        color: (d) => { const f = Math.max(0, Math.min(1, d / 10)), m = 1 - f;
          return `rgba(${Math.round(21 + 22 * m)},${Math.round(20 + 60 * m)},${Math.round(15 + 209 * m)},${(0.055 + m * 0.11).toFixed(3)})`; } }} />
      <div className="lp-top" data-reveal="none">
        <div className="lp-sig">{COPY.sig}</div>
        <button ref={fbtn} type="button" className="c-disc-btn">
          <span>what is a fractal?</span>
          <span className="c-disc-sign">+</span>
        </button>
      </div>
      <div className="c-stage">
        <h1 className="c-lead" data-split><span className="q">“You are what you consume”</span></h1>
        <p className="c-p" data-reveal data-reveal-delay="0.15">What you read, build, put in your body, and give your attention to. The most interesting problems are complex by nature — they never stay in their lane. I am a builder at heart, and I learn by doing.</p>
        <p className="c-p dim" data-reveal data-reveal-delay="0.25">If you happened to land here, hello. You're reading my inner monologue. Feel free to browse around and find something that speaks to you.</p>
        <div className="c-cta" data-reveal-group>
          <a className="navlink" href={LEARN_HREF} data-reveal>
            <div className="nl-row">
              <div className="nl-top"><span className="nl-k">Learn</span><span className="nl-arrow">→</span></div>
              <div className="nl-sub">ideas that shape my thoughts</div>
            </div>
          </a>
          <a className="navlink" href={BUILD_HREF} data-reveal>
            <div className="nl-row">
              <div className="nl-top"><span className="nl-k">Build</span><span className="nl-arrow">→</span></div>
              <div className="nl-sub">stuff I built with AI</div>
            </div>
          </a>
        </div>
      </div>
      <div className="lp-foot" data-reveal="none" data-reveal-delay="0.4">
        <span>{COPY.foot}</span>
        <span>deliberate · relentless</span>
      </div>
    </div>
  );
}

/* ---------------- Canvas wrapper ---------------- */
function HomepageCanvas() {
  return (
    <DesignCanvas>
      <DCSection id="home" title="Homepage" subtitle="Three directions · paper & ink · animated fractal · Learn / Build">
        <DCArtboard id="a" label="A · Native Mono" width={1480} height={940}><HomeA /></DCArtboard>
        <DCArtboard id="b" label="B · Editorial Sans" width={1480} height={940}><HomeB /></DCArtboard>
        <DCArtboard id="c" label="C · Fractal Hero" width={1480} height={940}><HomeC /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

Object.assign(window, { HomepageCanvas });
