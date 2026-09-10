# virtuo-scroll-area

React 的浮层滚动条组件：悬停显示的滚动条、悬浮「回到顶部」按钮、滚动上下文 API，以及围绕
[react-virtuoso](https://virtuoso.dev/) 的可选虚拟列表 / 虚拟网格封装。

- **零配置** —— 样式表在首次渲染时自动注入。不需要引入 CSS、不需要 Tailwind、不需要 Provider、
  不需要任何构建插件。
- **零运行时依赖** —— `react` / `react-dom` 是 peer 依赖，`react-virtuoso` 是**可选** peer 依赖，
  只有虚拟化入口才会用到。
- **可主题化** —— 所有视觉都由 `--vsa-*` CSS 变量驱动，且默认样式位于 `base` 级联层，
  你自己的 CSS（包括 Tailwind 工具类）永远能覆盖它。
- **原生支持 Shadow DOM** —— 渲染在 shadow root 内（用户脚本、浏览器扩展、Web Components）时，
  样式表会自动注入该 shadow root，滚轮滚动在宿主页面锁定 body 滚动时也照常工作。无需包装、无需额外 Hook。
- **类型完整、测试完善** —— 三个入口均提供 ESM + CJS + `.d.ts`，114 个单元测试，
  并有在真实浏览器中验证过的演示应用。

```tsx
import { ScrollArea } from 'virtuo-scroll-area';

<ScrollArea className="h-64 w-80 rounded-xl border">
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</ScrollArea>;
```

以上就是全部接入步骤。

---

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [组件](#组件)
  - [ScrollArea](#scrollarea)
  - [ScrollToTopButton](#scrolltotopbutton)
  - [滚动上下文](#滚动上下文)
- [虚拟化组件](#虚拟化组件)
- [主题变量](#主题变量)
- [样式与覆盖](#样式与覆盖)
- [Shadow DOM](#shadow-dom)
- [SSR、CSP 与 Next.js](#ssrcsp-与-nextjs)
- [底层 API](#底层-api)
- [示例](#示例)
- [开发](#开发)
- [浏览器支持](#浏览器支持)
- [从应用内组件迁移](#从应用内组件迁移)
- [许可证](#许可证)

---

## 安装

```bash
bun add virtuo-scroll-area
# 或 npm install virtuo-scroll-area / pnpm add virtuo-scroll-area
```

```bash
# 仅当使用 /virtuoso 与 /virtuoso-grid 入口时需要
bun add react-virtuoso
```

要求：**React 18 或 19** 以及任意打包工具，别无其他。

## 快速开始

```tsx
import { ScrollArea, ScrollToTopButton, ScrollContextProvider } from 'virtuo-scroll-area';

export function Panel() {
  const viewportRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContextProvider>
      <div className="relative">
        <ScrollArea
          viewportRef={viewportRef}
          className="h-72 rounded-xl border"
          viewportClassName="p-4"
        >
          {content}
        </ScrollArea>

        <ScrollToTopButton
          scrollerRef={viewportRef}
          scrollToTop={() =>
            viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }
        />
      </div>
    </ScrollContextProvider>
  );
}
```

## 组件

### ScrollArea

原生滚动条被隐藏，取而代之的是自定义滚动条：指针进入区域或内容滚动时淡入，停止后延迟淡出。

```tsx
<ScrollArea
  className="h-64 rounded-xl border"
  viewportClassName="p-4"
  scrollbarClassName="my-rail"
  scrollbarThumbClassName="my-thumb"
  scrollHideDelay={600}
>
  {children}
</ScrollArea>
```

| 属性                      | 类型                             | 默认值 | 说明                                                        |
| ------------------------- | -------------------------------- | ------ | ----------------------------------------------------------- |
| `viewportClassName`       | `string`                         | —      | 作用于内部滚动元素的类名（这里的 padding 会随内容一起滚动） |
| `viewportRef`             | `Ref<HTMLDivElement>`            | —      | 真正滚动的元素，用于命令式滚动                              |
| `scrollbarClassName`      | `string`                         | —      | 滚动条轨道类名                                              |
| `scrollbarThumbClassName` | `string`                         | —      | 滑块类名                                                    |
| `scrollHideDelay`         | `number`                         | `600`  | 淡出延迟（毫秒）                                            |
| `wheelScroll`             | `'auto' \| 'always' \| 'never'`  | `auto` | 是否手动接管滚轮，见 [Shadow DOM](#shadow-dom)              |
| `className`               | `string`                         | —      | 外层容器类名（**需要自己给高度**）                          |
| `children`                | `ReactNode`                      | —      | 滚动内容                                                    |
| 其余属性                  | `HTMLAttributes<HTMLDivElement>` | —      | 透传到外层容器（`data-*`、`aria-*`、`style` 等）            |

`ref` 指向**外层容器**；要滚动请使用 `viewportRef`。只有在内容确实可滚动时才显示滑块，
并且内容尺寸变化（懒加载、折叠、筛选）时会自动重新测量。

### ScrollToTopButton

滚动超过 `threshold` 后出现的悬浮按钮。虚拟化组件默认会渲染它；也可以单独用于任意可滚动元素。

```tsx
<ScrollToTopButton
  scrollerRef={viewportRef}
  scrollToTop={() => viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
  threshold={200}
  label="回到顶部"
  buttonOffset={{ x: -16, y: -8 }}
/>
```

| 属性                             | 类型                                | 默认值             | 说明                                             |
| -------------------------------- | ----------------------------------- | ------------------ | ------------------------------------------------ |
| `scrollerRef`                    | `RefObject<HTMLDivElement \| null>` | —（必填）          | 被观察 `scrollTop` 的元素                        |
| `scrollToTop`                    | `() => void`                        | —（必填）          | 点击时触发的回调                                 |
| `threshold`                      | `number`                            | `100`              | 超过多少像素后显示                               |
| `label`                          | `string`                            | `"Scroll to top"`  | 无障碍朗读文本                                   |
| `icon`                           | `ReactNode`                         | 内置箭头 SVG       | 自定义图标                                       |
| `buttonOffset`                   | `{ x?: number; y?: number }`        | `{ x: -12, y: 0 }` | 相对右边缘 / 垂直中心的偏移                      |
| `scrollToTopButtonClassName`     | `string`                            | —                  | 作用于 `<button>` 的额外类名                     |
| `scrollToTopButtonIconClassName` | `string`                            | —                  | 作用于默认图标的额外类名（自定义 `icon` 时无效） |

同时导出 `DEFAULT_BUTTON_OFFSET`、`DEFAULT_SCROLL_THRESHOLD`。

### 滚动上下文

`ScrollContextProvider` 为最近的可滚动区域提供平滑的 `scrollToTop` / `scrollToBottom`，
并提供一个按 id 管理多个区域的注册表。

```tsx
import {
  ScrollContextProvider,
  useScrollContext,
  useScrollToTop,
  useScrollToBottom,
} from 'virtuo-scroll-area';

<ScrollContextProvider>
  <Toolbar />
  <ScrollArea>{content}</ScrollArea>
  <VirtuosoGridScrollArea totalCount={51} scrollContextInstanceId="themes" … />
</ScrollContextProvider>;

function Toolbar() {
  const { getInstance } = useScrollContext();
  const scrollToTop = useScrollToTop();       // 最近注册的区域
  const scrollToBottom = useScrollToBottom();

  return (
    <>
      <button onClick={scrollToTop}>顶部</button>
      <button onClick={() => getInstance('themes')?.scrollToTop()}>主题列表回顶</button>
    </>
  );
}
```

| 导出                                       | 说明                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `ScrollContextProvider`                    | 提供上下文；可选，不套 Provider 时所有 Hook 也都安全                                                                         |
| `ScrollContextProvider` 的 `instanceId`    | 以固定 id 注册该区域的实例                                                                                                   |
| `useScrollContext()`                       | 完整上下文：`scrollToTop`、`scrollToBottom`、`setScrollAreaElement`、`registerInstance`、`unregisterInstance`、`getInstance` |
| `useScrollToTop()` / `useScrollToBottom()` | 操作最近注册区域的便捷 Hook                                                                                                  |
| `ScrollAreaInstance` / `ScrollContextType` | 自定义实例所需的类型                                                                                                         |

`ScrollArea` 与虚拟化组件都会把滚动元素注册到最近的 Provider，因此 `useScrollToTop()`
对普通滚动区域同样有效。

## 虚拟化组件

两个入口都依赖可选的 peer 依赖 `react-virtuoso`：

```tsx
import { VirtuosoScrollArea } from 'virtuo-scroll-area/virtuoso';
import { VirtuosoGridScrollArea } from 'virtuo-scroll-area/virtuoso-grid';
```

### VirtuosoScrollArea

```tsx
<VirtuosoScrollArea
  className="h-[60vh] rounded-xl border"
  data={books}
  itemClassName="px-4 py-2"
  scrollContextInstanceId="book-list"
  itemContent={(_index, book) => <BookRow book={book} />}
/>
```

主要属性：`data`、`itemContent`、`itemClassName`、`overscan`（默认 `200`）、
`increaseViewportBy`（默认 `200`）、`showScrollToTopButton`（默认 `true`）、
`scrollToTopButtonClassName`、`scrollToTopButtonIconClassName`、`buttonOffset`、
`scrollContextInstanceId`、`scrollbarClassName`、`scrollbarThumbClassName`、`scrollHideDelay`、
`wheelScroll`（默认 `'auto'`，见 [Shadow DOM](#shadow-dom)）、`className`。

通过 `ref` 暴露：`{ scrollToIndex(index, behavior?: 'auto' | 'smooth'), scrollToTop() }`。

### VirtuosoGridScrollArea

```tsx
<VirtuosoGridScrollArea
  className="h-[60vh] rounded-xl border"
  totalCount={books.length}
  gridClassName="grid-cols-2 gap-3 md:grid-cols-4"
  computeItemKey={(index) => books[index].id}
  itemContent={(index) => <BookCard book={books[index]} />}
/>
```

在列表属性的基础上增加 `totalCount`、`gridClassName`、`computeItemKey`、`onRangeChanged`，
并使用网格化的虚拟化默认值（`overscan={{ main: 200, reverse: 200 }}`、
`increaseViewportBy={{ top: 200, bottom: 200 }}`）。`ref` 暴露
`{ scrollToIndex(index, behavior?), scrollToTop() }`。

网格元素带有 `.vsa-grid-list`，默认单列、间距 16px。用 `gridClassName` 覆盖即可 ——
Tailwind 的 `grid-cols-4 gap-3` 或普通 CSS 都可以：

```css
.my-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
```

组件内部已处理两个 react-virtuoso 的坑：网格底部的多余空白，以及弹窗/面板入场动画结束后
通过 1px 布局扰动让列数按真实视口宽度重新计算。

## 主题变量

在组件上方的任意位置覆盖即可（包裹类或内联样式）：

```css
.my-panel {
  --vsa-scrollbar-width: 14px;
  --vsa-thumb-background: rgb(0 0 0 / 0.25);
  --vsa-thumb-background-hover: rgb(0 0 0 / 0.45);
  --vsa-scroll-to-top-background: #111827;
}
```

| 变量                                   | 默认值                      |
| -------------------------------------- | --------------------------- |
| `--vsa-scrollbar-width`                | `10px`                      |
| `--vsa-scrollbar-padding`              | `1px`                       |
| `--vsa-scrollbar-z-index`              | `50`                        |
| `--vsa-scrollbar-transition-duration`  | `200ms`                     |
| `--vsa-thumb-background`               | `rgb(115 115 115 / 0.42)`   |
| `--vsa-thumb-background-hover`         | `rgb(115 115 115 / 0.62)`   |
| `--vsa-thumb-radius`                   | `9999px`                    |
| `--vsa-thumb-transition-duration`      | `150ms`                     |
| `--vsa-thumb-height`                   | 由组件写入（只读）          |
| `--vsa-scroll-to-top-size`             | `40px`                      |
| `--vsa-scroll-to-top-icon-size`        | `20px`                      |
| `--vsa-scroll-to-top-background`       | `#2563eb`                   |
| `--vsa-scroll-to-top-background-hover` | `#1d4ed8`                   |
| `--vsa-scroll-to-top-foreground`       | `#ffffff`                   |
| `--vsa-scroll-to-top-shadow`           | 柔和阴影 `0 10px 15px -3px` |
| `--vsa-scroll-to-top-z-index`          | `50`                        |

暗色模式：在 `prefers-color-scheme: dark` 以及 `.dark` 祖先节点（shadcn/ui 约定）下自动切换。

**shadcn/ui 令牌映射**（一次配置，两边一致）：

```css
.vsa-scroll-area {
  --vsa-thumb-background: color-mix(in oklab, var(--muted-foreground) 30%, transparent);
  --vsa-thumb-background-hover: color-mix(
    in oklab,
    var(--muted-foreground) 50%,
    transparent
  );
  --vsa-scroll-to-top-background: var(--primary);
  --vsa-scroll-to-top-background-hover: var(--primary);
  --vsa-scroll-to-top-foreground: var(--primary-foreground);
}
```

## 样式与覆盖

样式表整体位于 `@layer base`，这一点很关键：

- 在 **Tailwind** 应用中，Tailwind 的 `components` / `utilities` 层优先级高于 `base`，
  所以 `className="bg-red-500"` 或 `grid-cols-4` 无需 `!important`、无需拼优先级即可覆盖本库；
  而本库仍能覆盖同一层中更早输出的 Preflight。
- 在**普通 CSS** 应用中，你未分层的规则永远优先于本库的层级规则。

可用的类名：

| 类名                                                                                       | 元素                                     |
| ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `.vsa-scroll-area`                                                                         | 外层容器（同时承载 CSS 变量）            |
| `.vsa-scroll-area-layout`                                                                  | `ScrollArea` 使用的 flex 布局修饰类      |
| `.vsa-viewport`                                                                            | 滚动元素（原生滚动条已隐藏）             |
| `.vsa-content`                                                                             | 视口内的内容包裹层                       |
| `.vsa-scrollbar`、`.vsa-thumb`                                                             | 轨道与滑块                               |
| `.vsa-scroll-to-top`                                                                       | 按钮外层（`data-visible="true\|false"`） |
| `.vsa-scroll-to-top-button`                                                                | `<button>` 本体                          |
| `.vsa-scroll-to-top-icon`                                                                  | 默认箭头图标                             |
| `.vsa-sr-only`                                                                             | 仅供屏幕阅读器的文本                     |
| `.vsa-virtualized-area`、`.vsa-virtualized-scroll-area`、`.vsa-scroller`、`.vsa-grid-list` | 虚拟化布局                               |

## Shadow DOM

把组件渲染进 shadow root（用户脚本、浏览器扩展、Web Components）以前需要两处手写补丁，现在都已内置：

- **样式。** `document` 级别的样式表穿不进 shadow tree，因此每个组件都会把样式表额外注入到自己
  所在的 shadow root（每个 root 只注入一次，以 `<style data-vsa-styles>` 追加到 root 末尾）。
  如果你已经自己放了一份——`<style data-vsa-styles>{styles}</style>`——库会检测到并跳过。
  也可以手动调用导出的 `injectStyles(shadowRoot)`。
- **滚轮滚动。** 宿主页面以及 body-scroll-lock 类库（Radix Dialog 的 `react-remove-scroll`、
  `body-scroll-lock` 等）会在 `document` 上监听 `wheel`，并把无法归属到它们认识的滚动容器的事件
  `preventDefault()` 掉。从 shadow tree 里冒出来的事件会被重定向到 shadow host，看起来永远是「外来」
  事件，于是统统被取消——列表就滚不动了。因此在 shadow root 内，组件会自己处理滚轮：在 viewport 上以
  capture、非 passive 方式监听，消费事件并按帧写入 `scrollTop`。

手动接管的行为向浏览器原生对齐：

- 保留滚动链——viewport 在滚轮方向上已经滚不动时，事件原样放行，由祖先（或宿主页面）继续滚动。
- 手势锁定——从 viewport 内开始的一次触控板滑动会一直作用于该 viewport，即使已经滚到边界，直到事件
  停顿超过 `WHEEL_LATCH_MS`（150 ms）。惯性滚动不会「冲」到下面的页面。
- 捏合缩放（`ctrlKey`）和纯横向滚轮事件永远不会被拦截。
- `deltaMode` 已归一化（Firefox 的行模式按每行 16 px 换算，页模式按 viewport 高度换算）。

通过 `wheelScroll` 属性控制，`ScrollArea`、`VirtuosoScrollArea`、`VirtuosoGridScrollArea` 均支持：

| 取值             | 行为                                                               |
| ---------------- | ------------------------------------------------------------------ |
| `'auto'`（默认） | 仅当 viewport 位于 `ShadowRoot` 内时手动接管，其余情况保持原生滚动 |
| `'always'`       | 始终手动接管——适用于普通 DOM 中被 body-scroll-lock 拦截的场景      |
| `'never'`        | 完全交给浏览器                                                     |

基于底层原语自定义布局时，可使用主入口导出的 `useWheelScroll(viewport, mode)` 与
`isInShadowRoot(node)`。

## SSR、CSP 与 Next.js

- 所有入口都以 `"use client"` 开头，可直接在 App Router 中引入。
- 没有 `document` 时 `injectStyles()` 直接返回，组件挂载后还会再检查一次，因此服务端渲染安全。
- 在严格的 `style-src` CSP 下，改为引入已发布的样式表：

  ```ts
  import 'virtuo-scroll-area/styles.css';
  ```

  注入是按 `#virtuo-scroll-area-styles` 幂等处理的，两者同时存在也无副作用。
  `injectStyles`、`styles`、`STYLE_ELEMENT_ID`、`STYLE_ELEMENT_ATTRIBUTE` 均已导出，便于高级用法。

## 底层 API

主入口还导出用于自定义滚动布局的底层能力：

- 组件：`ScrollAreaScrollbar`、`ScrollAreaScrollbarImpl`、`ScrollAreaThumb`、`Scroller`
- 上下文：`ScrollAreaContext`、`useScrollAreaContext`、`ScrollbarContext`、`useScrollbarContext`
- 几何计算：`toInt`、`getThumbRatio`、`getThumbSize`、`getThumbOffsetFromScroll`、
  `getScrollPositionFromPointer`、`linearScale`、`isScrollingWithinScrollbarBounds`、
  `addUnlinkedScrollListener`、`THUMB_MIN_SIZE`
- 工具 Hook：`useCallbackRef`、`useDebounceCallback`、`useResizeObserver`、
  `useIsomorphicLayoutEffect`、`useInjectedStyles`、`cx`
- Shadow DOM / 滚轮：`useWheelScroll`、`isInShadowRoot`、`WHEEL_LATCH_MS`、`WheelScrollMode`
- 样式：`injectStyles`、`styles`、`STYLE_ELEMENT_ID`、`STYLE_ELEMENT_ATTRIBUTE`、
  `generateScrollStyle`（已废弃）

## 示例

```bash
bun run demo             # 构建后在 :5199 启动 examples/vite-demo
bun run demo:build       # 演示应用的生产构建
bun run demo:standalone  # 生成单文件 HTML，无需服务器即可打开
```

`examples/vite-demo` 是完整演示：普通滚动区域、CSS 变量主题、5,000 行虚拟列表、
51 格虚拟网格，以及独立使用的回到顶部按钮。它**不使用 Tailwind，也没有引入任何 CSS** ——
这正是重点：只引入了组件。

## 开发

```bash
bun install
bun run typecheck     # tsc --noEmit
bun run test          # vitest（114 个测试）
bun run coverage      # v8 覆盖率
bun run build         # tsup → dist（ESM + CJS + .d.ts）
bun run verify:pack   # 打包 tarball、安装后按包名导入验证
bun run verify        # typecheck + test + build + verify:pack
bun run format        # prettier
```

贡献者注意：

- 类型声明由 tsup 的声明构建器生成，它尚不支持 TypeScript 7，因此 TypeScript 固定在 6.x，
  并在 `tsconfig.json` 中设置了 `ignoreDeprecations`。
- **不要**开启 tsup 的 `treeshake`，也不要强制 `splitting: true`：两者都会让产物经过 rollup
  处理并丢掉 `"use client"` 声明。
- `src/styles.ts` 以文本方式导入样式表（esbuild `text` loader）。Vitest 会替换 CSS 模块内容，
  因此 `vitest.config.ts` 把该路径指向 `test/fixtures/stylesheet.ts`。
- 虚拟化组件通过在 `test/mocks/react-virtuoso.tsx` 中 mock `react-virtuoso` 来测试，
  真实集成由演示应用覆盖。
- 若以链接方式（pnpm workspace、`file:` 依赖、本地 alias）引用本包，请在消费方 Vite 配置中加上
  `resolve.dedupe: ['react', 'react-dom']`，否则会打包两份 React。

## 浏览器支持

现代常青浏览器。样式表使用级联层、`rgb(r g b / a)` 颜色语法与 `scale` / `translate` 过渡，
代码使用 `ResizeObserver` 与 `requestAnimationFrame`。

## 从应用内组件迁移

导入路径对照表、CSS 变量改名、样式差异与新能力详见 [MIGRATION.md](./MIGRATION.md)。

## 许可证

[MIT](./LICENSE) © Alpha Liu
