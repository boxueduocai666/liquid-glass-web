# Liquid Glass Web

一个用于研究「Apple Liquid Glass 风格」光学材质的 Web 实验项目。

> 这不是 Apple 官方 Liquid Glass API，也不是 Apple 官方代码。项目使用浏览器能力重新实现相似的视觉原则，并把重点从普通 Glassmorphism 提升到真实的折射材质模拟。

## 当前渲染路线

- WebGL2 主渲染器：程序化背景 + SDF 圆角形状 + 边缘折射
- Chromatic dispersion：RGB 通道轻微分离
- Fresnel：根据表面法线计算边缘反射感
- Glare：随全局指针位置变化的动态高光
- Gaussian-style multi-tap blur：通过多次背景采样实现柔和透射
- Elasticity：非常克制的交互扰动
- SVG/CSS fallback：WebGL2 不可用时自动回退到 `backdrop-filter`
- React + TypeScript + Vite，无第三方 UI 框架

## 运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

预览：

```bash
npm run preview
```

## 设计原则

1. Liquid Glass 的核心是光学行为，而不是白色半透明背景。
2. 中心区域保持克制，主要折射集中在边缘和曲率区域。
3. 色散必须细微，不能变成彩虹描边。
4. Fresnel、bezel 与 glare 只用于建立材质厚度感。
5. 高质量渲染使用 WebGL2；兼容层保持可读性与低成本。
6. 移动端限制 DPR，并尊重 `prefers-reduced-motion`。

## 文件结构

```text
src/
├── App.tsx
├── main.tsx
├── styles.css
└── liquid-glass/
    ├── LiquidGlassCanvas.tsx
    ├── engine.ts
    └── shaders.ts
```

## 下一阶段

- 真实 DOM 背景捕获与折射纹理
- WebGPU backend
- 更精确的 superellipse / SDF 形状
- 多层材质与滚动/触控驱动高光
- Clear / Regular / Tinted 材质预设
- 抽离可发布的 React `LiquidGlass` component package
