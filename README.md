# Liquid Glass Web

一个用于研究「Apple Liquid Glass 风格」的 Web 材质实验项目。

> 这不是 Apple 官方 Liquid Glass API 的 Web 版本，也不是 Apple 官方代码。
> 它使用浏览器能力重新实现类似的视觉原则：透明度、背景采样、模糊、折射/位移、边缘高光、层次和动态光线。

## 技术栈

- React
- TypeScript
- Vite
- CSS `backdrop-filter`
- SVG `feTurbulence` + `feDisplacementMap`
- CSS gradients / blend modes
- 无运行时 Canvas
- 无第三方 UI 框架

## 运行

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

预览：

```bash
npm run preview
```

## 设计原则

1. Liquid Glass 是功能层材质，不把整个页面做成玻璃。
2. 玻璃尽可能吸收底层内容的颜色，而不是固定一层白色。
3. Clear / Regular 两种方向通过透明度、模糊和对比度控制表达。
4. 使用 SVG 位移制造轻微折射，而不是简单的 `rgba + blur`。
5. 边缘高光与内阴影只作为光学提示，避免厚重的“柔光玻璃”。
6. 移动端减少大面积玻璃和高成本效果。
7. `prefers-reduced-motion` 下关闭持续动画。

## 后续可升级

- 独立 `Glass` React component package
- 真实背景纹理采样
- 多层 refraction / chromatic aberration
- pointer / scroll driven highlight
- SVG SDF bezel
- WebGPU/WebGL 高性能实验版
- Clear / Regular / Tinted 三种材质预设
- 无障碍高对比度模式
