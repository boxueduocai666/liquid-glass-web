export const VERTEX_SHADER = `#version 300 es
precision highp float;

const vec2 POSITIONS[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);

out vec2 vUv;

void main() {
  vec2 position = POSITIONS[gl_VertexID];
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

#define MAX_PANELS 12

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform int uPanelCount;

uniform vec4 uPanelRect[MAX_PANELS];
// x radius, y refraction, z thickness, w blur
uniform vec4 uPanelMaterial[MAX_PANELS];
// x dispersion, y fresnel, z glare, w tint
uniform vec4 uPanelOptical[MAX_PANELS];
// x elasticity, y opacity, z reserved, w reserved
uniform vec4 uPanelInteraction[MAX_PANELS];

out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 background(vec2 uv) {
  vec2 p = uv;
  float t = uTime * 0.035;

  vec3 base = mix(vec3(0.018, 0.055, 0.080), vec3(0.055, 0.115, 0.145), p.y);
  vec3 cyan = vec3(0.08, 0.58, 0.72);
  vec3 ice = vec3(0.28, 0.70, 0.96);
  vec3 violet = vec3(0.30, 0.22, 0.72);

  float a = exp(-distance(p, vec2(0.18 + 0.03 * sin(t), 0.68)) * 3.2);
  float b = exp(-distance(p, vec2(0.82 + 0.04 * sin(t * 0.8), 0.77)) * 3.1);
  float c = exp(-distance(p, vec2(0.64, 0.22 + 0.05 * cos(t * 0.7))) * 4.0);

  float bands = 0.5 + 0.5 * sin(p.x * 8.0 + p.y * 5.0 + t * 2.4);
  float n = noise(p * 5.0 + t);

  vec3 color = base;
  color += cyan * a * 0.46;
  color += ice * b * 0.38;
  color += violet * c * 0.25;
  color += vec3(0.02, 0.08, 0.11) * bands * 0.32;
  color += vec3(n) * 0.012;

  float vignette = smoothstep(1.05, 0.12, distance(p, vec2(0.5)));
  color *= mix(0.72, 1.04, vignette);
  return color;
}

float roundedBoxSdf(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 sdfNormal(vec2 p, vec2 halfSize, float radius) {
  const float e = 0.75;
  float dx = roundedBoxSdf(p + vec2(e, 0.0), halfSize, radius) - roundedBoxSdf(p - vec2(e, 0.0), halfSize, radius);
  float dy = roundedBoxSdf(p + vec2(0.0, e), halfSize, radius) - roundedBoxSdf(p - vec2(0.0, e), halfSize, radius);
  return normalize(vec2(dx, dy) + 1e-5);
}

vec3 blurSample(vec2 uv, float radius) {
  vec2 px = 1.0 / uResolution;
  vec2 o = px * radius;
  vec3 c = background(uv) * 0.34;
  c += background(uv + vec2(o.x, 0.0)) * 0.16;
  c += background(uv - vec2(o.x, 0.0)) * 0.16;
  c += background(uv + vec2(0.0, o.y)) * 0.17;
  c += background(uv - vec2(0.0, o.y)) * 0.17;
  return c;
}

vec3 applySaturation(vec3 color, float amount) {
  float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), color, amount);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uResolution;
  vec3 color = background(uv);

  for (int i = 0; i < MAX_PANELS; i++) {
    if (i >= uPanelCount) break;

    vec4 rect = uPanelRect[i];
    vec4 mat = uPanelMaterial[i];
    vec4 opt = uPanelOptical[i];
    vec4 inter = uPanelInteraction[i];

    vec2 center = rect.xy;
    vec2 halfSize = rect.zw * 0.5;
    float radius = min(mat.x, min(halfSize.x, halfSize.y));
    vec2 local = frag - center;
    float sdf = roundedBoxSdf(local, halfSize, radius);

    if (sdf > 1.5) continue;

    float edgeBand = max(8.0, min(34.0, mat.z * 0.9 + 5.0));
    float edge = 1.0 - smoothstep(-edgeBand, 0.0, sdf);
    float inside = 1.0 - smoothstep(0.0, 1.5, sdf);

    vec2 normal = sdfNormal(local, halfSize, radius);
    vec2 normalizedNormal = normal / uResolution * 2.0;

    vec2 toPointer = uPointer - center;
    float pointerDistance = length(toPointer);
    vec2 lightDir = pointerDistance > 0.001 ? normalize(toPointer) : vec2(0.35, 0.82);
    float viewFacing = max(0.0, dot(normal, lightDir));

    float curve = edge * edge * (0.35 + mat.z * 0.025);
    curve += inter.x * 0.004 * sin(pointerDistance * 0.012 + uTime * 0.5) * edge;

    vec2 refractUv = uv + normalizedNormal * (mat.y * curve);
    float dispersion = opt.x * curve * 0.55;
    vec2 d = normalizedNormal * dispersion;

    vec3 refracted;
    refracted.r = blurSample(refractUv + d, mat.w).r;
    refracted.g = blurSample(refractUv, mat.w * 0.92).g;
    refracted.b = blurSample(refractUv - d, mat.w).b;
    refracted = applySaturation(refracted, 1.0 + opt.x * 0.10);

    vec3 transmitted = mix(background(uv), refracted, 0.72 + edge * 0.28);

    float fresnel = pow(1.0 - max(0.0, dot(normal, vec2(0.0, 1.0))), 3.0);
    fresnel *= edge * opt.y;

    float glare = pow(max(0.0, viewFacing), 8.0) * edge * opt.z;
    float rim = edge * edge * 0.16;

    vec3 tinted = transmitted;
    tinted = mix(tinted, tinted + vec3(0.015, 0.028, 0.045), opt.w * 0.8);
    tinted = mix(tinted, vec3(1.0), fresnel * 0.10);
    tinted += vec3(0.86, 0.96, 1.0) * (glare * 0.085 + rim * 0.07);

    float softBody = 0.05 + 0.025 * sin(uTime * 0.35 + float(i) * 2.2);
    tinted += vec3(0.92, 0.97, 1.0) * softBody;

    float alpha = inside * inter.y;
    color = mix(color, tinted, alpha);

    // Thin physical-looking bezel.
    float bezel = 1.0 - smoothstep(-2.0, 0.7, sdf);
    color = mix(color, vec3(0.94, 0.985, 1.0), bezel * 0.16 * opt.y);

    // Inner shadow makes the edge read as a curved volume without becoming a white border.
    float innerShade = smoothstep(0.0, -min(18.0, mat.z * 0.7 + 5.0), sdf) * edge;
    color *= 1.0 - innerShade * 0.055;
  }

  outColor = vec4(color, 1.0);
}
`;
