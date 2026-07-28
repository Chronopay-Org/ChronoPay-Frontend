import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DurationChips from '@/components/dashboard/DurationChips';

describe('DurationChips', () => {
  it('renders chips with counts and toggles selection', () => {
    const counts = { 15: 1, 30: 2, 60: 0 };
    const onChange = vi.fn();

    render(<DurationChips counts={counts} onChange={onChange} />);

    const btn30 = screen.getByRole('button', { name: /30m/i });
    expect(btn30).toBeTruthy();
    // initial not pressed
    expect(btn30).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn30);
    expect(btn30).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenCalledWith(30);

    // clicking again clears
    fireEvent.click(btn30);
    expect(btn30).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
