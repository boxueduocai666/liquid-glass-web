import { useMemo, useState } from "react";

type Controls = {
  blur: number;
  frost: number;
  refraction: number;
  highlight: number;
  tint: number;
  radius: number;
};

const defaults: Controls = {
  blur: 18,
  frost: 0.18,
  refraction: 0.85,
  highlight: 0.72,
  tint: 0,
  radius: 30,
};

function Glass({
  children,
  className = "",
  controls = defaults,
}: {
  children: React.ReactNode;
  className?: string;
  controls?: Controls;
}) {
  const style = {
    "--lg-blur": `${controls.blur}px`,
    "--lg-frost": controls.frost,
    "--lg-refraction": controls.refraction,
    "--lg-highlight": controls.highlight,
    "--lg-tint": controls.tint,
    "--lg-radius": `${controls.radius}px`,
  } as React.CSSProperties;

  return (
    <div className={`glass ${className}`} style={style}>
      <div className="glass__distortion" aria-hidden="true" />
      <div className="glass__rim" aria-hidden="true" />
      <div className="glass__content">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider">
      <span>
        <b>{label}</b>
        <em>{value}{suffix}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export default function App() {
  const [controls, setControls] = useState(defaults);
  const [active, setActive] = useState("Home");

  const styleVars = useMemo(
    () =>
      ({
        "--ocean-shift": `${controls.refraction * 7}px`,
      }) as React.CSSProperties,
    [controls.refraction]
  );

  const update = (key: keyof Controls) => (value: number) =>
    setControls((current) => ({ ...current, [key]: value }));

  return (
    <main className="stage" style={styleVars}>
      <svg className="filter-defs" aria-hidden="true">
        <defs>
          <filter id="liquid-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.025"
              numOctaves="2"
              seed="17"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={controls.refraction * 8}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="aurora aurora--one" />
      <div className="aurora aurora--two" />
      <div className="aurora aurora--three" />
      <div className="grain" />

      <header className="topbar">
        <Glass className="nav-glass" controls={controls}>
          <div className="brand">
            <span className="brand-orb" />
            <span>Liquid Glass Web</span>
          </div>
          <nav>
            {["Home", "Components", "Playground"].map((item) => (
              <button
                key={item}
                className={active === item ? "nav-item active" : "nav-item"}
                onClick={() => setActive(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <button className="round-button" aria-label="Settings">•••</button>
        </Glass>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">WEB MATERIAL LAB · 01</span>
          <h1>
            Glass that
            <br />
            <span>lets the world through.</span>
          </h1>
          <p>
            A browser-native experiment inspired by the principles of Apple’s
            Liquid Glass: translucent, dynamic, contextual, and restrained.
          </p>
          <div className="hero-actions">
            <button className="primary-action">Explore the material <span>↗</span></button>
            <button className="text-action">View components</button>
          </div>
        </div>

        <div className="hero-demo">
          <Glass className="hero-card" controls={controls}>
            <div className="demo-topline">
              <span>LIQUID SURFACE</span>
              <span className="live"><i /> LIVE</span>
            </div>
            <div className="orbital">
              <div className="orbital-ring ring-one" />
              <div className="orbital-ring ring-two" />
              <div className="glass-orb">
                <span />
              </div>
            </div>
            <div className="demo-bottom">
              <div>
                <small>REFRACTION</small>
                <strong>{controls.refraction.toFixed(2)}</strong>
              </div>
              <div>
                <small>TRANSMISSION</small>
                <strong>{Math.round((1 - controls.frost) * 100)}%</strong>
              </div>
              <div>
                <small>LIGHT</small>
                <strong>{Math.round(controls.highlight * 100)}%</strong>
              </div>
            </div>
          </Glass>
        </div>
      </section>

      <section className="lab-grid">
        <Glass className="control-panel" controls={controls}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MATERIAL CONTROLS</span>
              <h2>Shape the glass</h2>
            </div>
            <button className="reset" onClick={() => setControls(defaults)}>Reset</button>
          </div>
          <Slider label="Blur" value={controls.blur} min={4} max={42} suffix="px" onChange={update("blur")} />
          <Slider label="Frost" value={controls.frost} min={0.02} max={0.5} step={0.01} onChange={update("frost")} />
          <Slider label="Refraction" value={controls.refraction} min={0} max={2} step={0.01} onChange={update("refraction")} />
          <Slider label="Specular light" value={controls.highlight} min={0} max={1} step={0.01} onChange={update("highlight")} />
          <Slider label="Tint" value={controls.tint} min={0} max={1} step={0.01} onChange={update("tint")} />
          <Slider label="Radius" value={controls.radius} min={12} max={48} suffix="px" onChange={update("radius")} />
        </Glass>

        <div className="component-stack">
          <Glass className="mini-card" controls={controls}>
            <span className="icon">✦</span>
            <div>
              <small>GLASS CARD</small>
              <h3>Context stays visible.</h3>
              <p>The background is part of the material, not a color painted over it.</p>
            </div>
          </Glass>

          <div className="button-row">
            <Glass className="pill" controls={controls}><span>Clear</span></Glass>
            <Glass className="pill selected" controls={controls}><span>Regular</span></Glass>
            <Glass className="pill" controls={controls}><span>Stained</span></Glass>
          </div>

          <Glass className="status-card" controls={controls}>
            <div className="status-icon">◌</div>
            <div>
              <small>MATERIAL STATE</small>
              <strong>Adaptive · translucent · live</strong>
            </div>
            <span className="chevron">›</span>
          </Glass>
        </div>
      </section>

      <footer>
        <span>Liquid Glass Web — experimental material system</span>
        <span>CSS · SVG · React · no canvas</span>
      </footer>
    </main>
  );
}