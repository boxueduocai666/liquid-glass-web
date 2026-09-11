import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { LiquidGlassRenderer, type GlassPanel } from "./engine";

export type GlassControls = {
  blur: number;
  refraction: number;
  thickness: number;
  dispersion: number;
  fresnel: number;
  glare: number;
  tint: number;
  radius: number;
  elasticity: number;
  opacity: number;
};

export const DEFAULT_GLASS_CONTROLS: GlassControls = {
  blur: 2.2,
  refraction: 1.7,
  thickness: 18,
  dispersion: 1.7,
  fresnel: 0.9,
  glare: 0.8,
  tint: 0.22,
  radius: 28,
  elasticity: 0.12,
  opacity: 0.98,
};

type Registration = {
  element: HTMLElement;
  controls: GlassControls;
  id: string;
};

type GlassContextValue = {
  register: (registration: Registration) => void;
  unregister: (id: string) => void;
  update: (registration: Registration) => void;
  rendererReady: boolean;
  webglSupported: boolean;
};

const GlassContext = createContext<GlassContextValue | null>(null);

export function LiquidGlassProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<LiquidGlassRenderer | null>(null);
  const registrationsRef = useRef(new Map<string, Registration>());
  const [webglSupported, setWebglSupported] = useState(true);
  const [rendererReady, setRendererReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      rendererRef.current = new LiquidGlassRenderer(canvas);
      setRendererReady(true);
      registrationsRef.current.forEach((registration) => {
        const panel = makePanel(registration);
        rendererRef.current?.register(panel);
      });
    } catch {
      setWebglSupported(false);
      setRendererReady(false);
    }
    return () => rendererRef.current?.destroy();
  }, []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const host = canvasRef.current?.parentElement;
      if (!host || !rendererRef.current) return;
      const rect = host.getBoundingClientRect();
      rendererRef.current.setPointer(event.clientX - rect.left, event.clientY - rect.top);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  const value = useMemo<GlassContextValue>(() => ({
    register(registration) {
      registrationsRef.current.set(registration.id, registration);
      if (rendererRef.current) rendererRef.current.register(makePanel(registration));
    },
    unregister(id) {
      registrationsRef.current.delete(id);
      rendererRef.current?.unregister(id);
    },
    update(registration) {
      registrationsRef.current.set(registration.id, registration);
      if (rendererRef.current) rendererRef.current.update(makePanel(registration));
    },
    rendererReady,
    webglSupported,
  }), [rendererReady, webglSupported]);

  return (
    <GlassContext.Provider value={value}>
      <canvas ref={canvasRef} className="liquid-glass-renderer" aria-hidden="true" />
      {children}
    </GlassContext.Provider>
  );
}

function makePanel(registration: Registration): GlassPanel {
  const rect = registration.element.getBoundingClientRect();
  const parent = registration.element.closest<HTMLElement>(".stage")?.getBoundingClientRect();
  const parentRect = parent ?? { left: 0, top: 0 };
  return {
    id: registration.id,
    x: rect.left - parentRect.left,
    y: rect.top - parentRect.top,
    width: rect.width,
    height: rect.height,
    radius: registration.controls.radius,
    refraction: registration.controls.refraction,
    thickness: registration.controls.thickness,
    blur: registration.controls.blur,
    dispersion: registration.controls.dispersion,
    fresnel: registration.controls.fresnel,
    glare: registration.controls.glare,
    tint: registration.controls.tint,
    elasticity: registration.controls.elasticity,
    opacity: registration.controls.opacity,
  };
}

export function useGlassPanel(
  ref: RefObject<HTMLElement | null>,
  id: string,
  controls: GlassControls,
) {
  const context = useContext(GlassContext);

  useEffect(() => {
    if (!context || !ref.current) return;
    const element = ref.current;
    const registration = { id, element, controls };
    context.register(registration);
    const update = () => context.update({ id, element, controls });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      context.unregister(id);
    };
  }, [context, id, ref, controls]);

  return context;
}

export function glassFallbackStyle(controls: GlassControls): CSSProperties {
  return {
    ["--lg-blur" as string]: `${Math.max(4, controls.blur * 5.5)}px`,
    ["--lg-radius" as string]: `${controls.radius}px`,
    ["--lg-opacity" as string]: controls.opacity,
    ["--lg-tint" as string]: controls.tint,
    ["--lg-fresnel" as string]: controls.fresnel,
  } as CSSProperties;
}
