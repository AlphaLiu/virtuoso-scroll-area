import { describe, expect, it } from 'vitest';

import { cx } from '../src/lib/cx';

describe('cx', () => {
  it('joins strings and numbers', () => {
    expect(cx('a', 'b')).toBe('a b');
    expect(cx('a', 1)).toBe('a 1');
  });

  it('drops falsy values', () => {
    expect(cx('a', null, undefined, false, '', 'b')).toBe('a b');
    expect(cx()).toBe('');
  });

  it('flattens nested arrays', () => {
    expect(cx('a', ['b', ['c', ['d']]])).toBe('a b c d');
  });

  it('keeps object keys with truthy values', () => {
    expect(cx('a', { b: true, c: false, d: null, e: undefined })).toBe('a b');
  });

  it('handles conditional input the way class utilities are used in practice', () => {
    const isActive = true;
    const isHidden = false;
    expect(cx('vsa-thumb', isActive && 'is-active', isHidden && 'is-hidden')).toBe(
      'vsa-thumb is-active',
    );
  });

  it('does not deduplicate class names (no tailwind-merge semantics)', () => {
    expect(cx('a', 'a')).toBe('a a');
  });
});
