import React from 'react';
import { render } from '@testing-library/react';
import { ThemePreviewStrip } from './theme-preview-strip';

describe('ThemePreviewStrip', () => {
  it('renders correctly with valid time inputs', () => {
    // 06:00 is 25%, 18:00 is 75%. start = 25%, end = 75%. width = 50%
    const { container } = render(
      <ThemePreviewStrip lightTime="06:00" darkTime="18:00" />
    );
    const stripFill = container.querySelector('.bg-orange-400');
    expect(stripFill).toBeInTheDocument();
    expect(stripFill).toHaveStyle('left: 25%');
    expect(stripFill).toHaveStyle('width: 50%');
  });

  it('handles invalid time format by falling back to 0%', () => {
    const { container } = render(
      <ThemePreviewStrip lightTime="invalid" darkTime="invalid" />
    );
    const stripFill = container.querySelector('.bg-orange-400');
    expect(stripFill).toHaveStyle('left: 0%');
    expect(stripFill).toHaveStyle('width: 0%'); // 0 - 0 = 0
  });

  it('handles empty strings by falling back to 0%', () => {
    const { container } = render(
      <ThemePreviewStrip lightTime="" darkTime="" />
    );
    const stripFill = container.querySelector('.bg-orange-400');
    expect(stripFill).toHaveStyle('left: 0%');
    expect(stripFill).toHaveStyle('width: 0%');
  });

  it('handles times out of standard range if constrained', () => {
    // Math.min/max are applied.
    // 25:00 -> 25*60 = 1500 -> 1500/1440 * 100 > 100%, capped at 100%.
    const { container } = render(
      <ThemePreviewStrip lightTime="00:00" darkTime="25:00" />
    );
    const stripFill = container.querySelector('.bg-orange-400');
    expect(stripFill).toHaveStyle('left: 0%');
    expect(stripFill).toHaveStyle('width: 100%');
  });

  it('handles reversed times (light after dark) with negative width safely', () => {
    // If lightTime > darkTime, start > end, so width becomes negative.
    // In actual CSS, negative width is usually ignored or treated as 0 depending on context,
    // but the inline style will just literally say `width: -...%`. 
    // This is a boundary behavior check.
    const { container } = render(
      <ThemePreviewStrip lightTime="18:00" darkTime="06:00" />
    );
    const stripFill = container.querySelector('.bg-orange-400');
    expect(stripFill).toHaveStyle('left: 75%');
    expect(stripFill).toHaveStyle('width: -50%');
  });
});
