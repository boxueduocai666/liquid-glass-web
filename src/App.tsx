import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  DEFAULT_GLASS_CONTROLS,
  LiquidGlassProvider,
  glassFallbackStyle,
  useGlassPanel,
  type GlassControls,
} from "./liquid-glass/LiquidGlassCanvas";

type GlassProps = {
  children: ReactNode;
  className?: string;
  controls: GlassControls;
};

function Glass({ children, className = "", controls }: GlassProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const id = useMemo(() => `glass-${Math.random().toString(36).slice(2)}`, []);
  const context = useGlassPanel(ref, id, controls);
  const fallback = !context?.webglSupported;

  return (
    <div
      ref={ref}
      className={`glass ${fallback ? "glass--fallback" : ""} ${className}`}
      style={glassFallbackStyle(controls)}
    >
      <div className="glass__fallback-surface" aria-hidden="true" />
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.currentTarget.value))} />
    </label>
  );
}

function AppContent() {
  const [controls, setControls] = useState(DEFAULT_GLASS_CONTROLS);
  const [active, setActive] = useState("Material");

  const update = (key: keyof GlassControls) => (value: number) =>
    setControls((current) => ({ ...current, [key]: value }));

  const reset = () => setControls(DEFAULT_GLASS_CONTROLS);

  return (
    <main className="stage">
      <div className="backdrop-grid" aria-hidden="true" />
      <div className="aurora aurora--one" aria-hidden="true" />
      <div className="aurora aurora--two" aria-hidden="true" />
      <div className="aurora aurora--three" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <Glass className="nav-glass" controls={controls}>
          <div className="brand">
            <span className="brand-orb" />
            <span>Liquid Glass Web</span>
          </div>
          <nav>
            {["Material", "Components", "Shader"].map((item) => (
              <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}>
                {item}
              </button>
            ))}
          </nav>
          <button className="round-button" aria-label="Reset material" onClick={reset}>↺</button>
        </Glass>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">WEBGL2 MATERIAL LAB · 02</span>
          <h1>
            Not glass <br />
            <span>— refraction.</span>
          </h1>
          <p>
            A browser-native material experiment that treats Liquid Glass as an optical surface: SDF volume, edge refraction, subtle RGB dispersion, Fresnel lighting and live interaction.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => document.querySelector(".control-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
              Tune the material <span>↘</span>
            </button>
            <button className="text-action" onClick={reset}>Reset defaults</button>
          </div>
        </div>

        <div className="hero-demo">
          <Glass className="hero-card" controls={controls}>
            <div className="demo-topline"><span>LIQUID SURFACE</span><span className="live"><i /> LIVE</span></div>
            <div className="orbital">
              <div className="orbital-ring ring-one" />
              <div className="orbital-ring ring-two" />
              <div className="glass-orb"><span /></div>
            </div>
            <div className="demo-bottom">
              <div><small>REFRACTION</small><strong>{controls.refraction.toFixed(2)}</strong></div>
              <div><small>DISPERSION</small><strong>{controls.dispersion.toFixed(2)}</strong></div>
              <div><small>FRESNEL</small><strong>{Math.round(controls.fresnel * 100)}%</strong></div>
            </div>
          </Glass>
        </div>
      </section>

      <section className="lab-grid">
        <Glass className="control-panel" controls={controls}>
          <div className="panel-heading">
            <div><span className="eyebrow">MATERIAL CONTROLS</span><h2>Shape the surface</h2></div>
            <button className="reset" onClick={reset}>Reset</button>
          </div>
          <Slider label="Blur radius" value={controls.blur} min={0.4} max={5} step={0.1} suffix="px" onChange={update("blur")} />
          <Slider label="Refraction" value={controls.refraction} min={0} max={3} step={0.01} onChange={update("refraction")} />
          <Slider label="Thickness" value={controls.thickness} min={4} max={34} step={1} suffix="px" onChange={update("thickness")} />
          <Slider label="Dispersion" value={controls.dispersion} min={0} max={4} step={0.05} onChange={update("dispersion")} />
          <Slider label="Fresnel" value={controls.fresnel} min={0} max={1.5} step={0.01} onChange={update("fresnel")} />
          <Slider label="Glare" value={controls.glare} min={0} max={1.6} step={0.01} onChange={update("glare")} />
          <Slider label="Tint" value={controls.tint} min={0} max={1} step={0.01} onChange={update("tint")} />
          <Slider label="Radius" value={controls.radius} min={12} max={48} suffix="px" onChange={update("radius")} />
        </Glass>

        <div className="component-stack">
          <Glass className="mini-card" controls={controls}>
            <span className="icon">✦</span>
            <div><small>EDGE REFRACTION</small><h3>Context stays visible.</h3><p>Only the optical edge bends the scene. The center stays calm and readable instead of turning into white frosted glass.</p></div>
          </Glass>
          <div className="button-row">
            <Glass className="pill" controls={{ ...controls, tint: 0 }}><span>Clear</span></Glass>
            <Glass className="pill selected" controls={controls}><span>Regular</span></Glass>
            <Glass className="pill" controls={{ ...controls, tint: 0.42 }}><span>Stained</span></Glass>
          </div>
          <Glass className="status-card" controls={controls}>
            <div className="status-icon">◎</div>
            <div><small>RENDERER</small><strong>WebGL2 · SDF · Fresnel · RGB</strong></div>
            <span className="chevron">›</span>
          </Glass>
        </div>
      </section>

      <footer><span>Liquid Glass Web — experimental optical material system</span><span>WebGL2 · React · SVG/CSS fallback</span></footer>
    </main>
  );
}

export default function App() {
  return (
    <LiquidGlassProvider>
      <AppContent />
    </LiquidGlassProvider>
  );
}
