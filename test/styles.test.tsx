import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  injectStyles,
  STYLE_ELEMENT_ATTRIBUTE,
  STYLE_ELEMENT_ID,
  styles,
} from '../src/styles';
import { generateScrollStyle, ScrollArea, ScrollToTopButton } from '../src/index';

describe('stylesheet', () => {
  it('exposes the raw CSS', () => {
    expect(typeof styles).toBe('string');
    expect(styles.length).toBeGreaterThan(1000);
  });

  it('is scoped to the vsa- prefix and never to host-app tokens', () => {
    for (const selector of [
      '.vsa-scroll-area',
      '.vsa-viewport',
      '.vsa-scrollbar',
      '.vsa-thumb',
    ]) {
      expect(styles).toContain(selector);
    }

    // Guards the decoupling from the application this component was extracted from: no Tailwind
    // utility classes, no shadcn tokens, no path aliases, no icon-library leakage.
    for (const foreign of [
      'bg-muted-foreground',
      'text-primary-foreground',
      'shadow-ink-lg',
      'scrollbar-none',
      '@/lib',
      'lucide',
      'radix-scroll-area',
    ]) {
      expect(styles).not.toContain(foreign);
    }
  });

  it('declares its theming variables inside the base cascade layer', () => {
    expect(styles).toContain('@layer base');
    for (const variable of [
      '--vsa-scrollbar-width',
      '--vsa-scrollbar-padding',
      '--vsa-thumb-background',
      '--vsa-thumb-background-hover',
      '--vsa-thumb-radius',
      '--vsa-scroll-to-top-size',
      '--vsa-scroll-to-top-background',
      '--vsa-scroll-to-top-foreground',
    ]) {
      expect(styles).toContain(variable);
    }
  });

  it('hides the native scrollbar and animates the button', () => {
    expect(styles).toContain('.vsa-viewport::-webkit-scrollbar');
    expect(styles).toContain('scrollbar-width: none');
    expect(styles).toContain('@keyframes vsa-slow-bounce');
    expect(styles).toContain('prefers-reduced-motion');
  });

  it('keeps box-sizing explicit so it works without a CSS reset', () => {
    expect(styles).toContain('box-sizing: border-box');
  });
});

describe('injectStyles', () => {
  it('injects a single style element tagged with the public id', () => {
    const existing = document.getElementById(STYLE_ELEMENT_ID);
    if (!existing) injectStyles();

    const element = document.getElementById(STYLE_ELEMENT_ID);
    expect(element).toBeInstanceOf(HTMLStyleElement);
    expect(element).toHaveAttribute('data-vsa-styles');
    expect(element?.textContent).toBe(styles);
  });

  it('is idempotent', () => {
    injectStyles();
    injectStyles();
    expect(document.querySelectorAll(`#${STYLE_ELEMENT_ID}`)).toHaveLength(1);
  });

  it('is a no-op without a document (SSR safety)', () => {
    expect(() => injectStyles(null)).not.toThrow();
  });

  it('injects into an explicit document', () => {
    const frame = document.implementation.createHTMLDocument('other');
    injectStyles(frame);

    expect(frame.getElementById(STYLE_ELEMENT_ID)?.textContent).toBe(styles);
  });

  it('injects into a shadow root once, without reusing the document id', () => {
    const shadow = document.createElement('div').attachShadow({ mode: 'open' });

    injectStyles(shadow);
    injectStyles(shadow);

    const sheets = shadow.querySelectorAll(`style[${STYLE_ELEMENT_ATTRIBUTE}]`);
    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.textContent).toBe(styles);
    expect(sheets[0]?.id).toBe('');
  });

  it('respects a stylesheet the consumer already placed in the shadow root', () => {
    const shadow = document.createElement('div').attachShadow({ mode: 'open' });
    const own = document.createElement('style');
    own.setAttribute(STYLE_ELEMENT_ATTRIBUTE, '');
    own.textContent = '/* mine */';
    shadow.appendChild(own);

    injectStyles(shadow);
    expect(shadow.querySelectorAll('style')).toHaveLength(1);
  });
});

describe('automatic injection from components', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts.splice(0)) host.remove();
  });

  function shadowContainer(): HTMLElement {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    const container = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(container);
    return container;
  }

  it('ScrollArea injects the stylesheet into the shadow root it renders in', () => {
    const container = shadowContainer();
    render(<ScrollArea>content</ScrollArea>, { container });

    const root = container.getRootNode() as ShadowRoot;
    expect(root.querySelectorAll(`style[${STYLE_ELEMENT_ATTRIBUTE}]`)).toHaveLength(1);
    expect(root.querySelector('style')?.textContent).toBe(styles);
  });

  it('ScrollToTopButton injects it too when used standalone', () => {
    const container = shadowContainer();
    render(<ScrollToTopButton scrollToTop={() => {}} scrollerRef={{ current: null }} />, {
      container,
    });

    const root = container.getRootNode() as ShadowRoot;
    expect(root.querySelectorAll(`style[${STYLE_ELEMENT_ATTRIBUTE}]`)).toHaveLength(1);
  });

  it('does not add a shadow sheet for light-DOM renders', () => {
    const before = document.querySelectorAll(`style[${STYLE_ELEMENT_ATTRIBUTE}]`).length;
    render(<ScrollArea>content</ScrollArea>);
    expect(document.querySelectorAll(`style[${STYLE_ELEMENT_ATTRIBUTE}]`)).toHaveLength(
      Math.max(before, 1),
    );
  });
});

describe('generateScrollStyle (deprecated helper)', () => {
  it('still returns the virtuoso scroller rules', () => {
    const css = generateScrollStyle();
    expect(css).toContain('data-virtuoso-scroller');
    expect(css).toContain('overflow-y: scroll !important');
  });
});
