import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrustStrip, TRUST_INDICATORS } from '../TrustStrip';

describe('TrustStrip component', () => {
  it('renders the trust and safety region', () => {
    render(<TrustStrip />);
    const section = screen.getByRole('region', { name: /trust and safety guarantees/i });
    expect(section).toBeInTheDocument();
  });

  it('renders all trust indicators with correct labels and tooltips', () => {
    render(<TrustStrip />);
    
    TRUST_INDICATORS.forEach((indicator) => {
      const element = screen.getByText(indicator.label);
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('title', indicator.tooltip);
    });
  });

  it('ensures indicator text is focusable for keyboard accessibility', () => {
    render(<TrustStrip />);
    
    TRUST_INDICATORS.forEach((indicator) => {
      const element = screen.getByText(indicator.label);
      expect(element).toHaveAttribute('tabIndex', '0');
    });
  });

  it('has semantic list structure for screen readers', () => {
    render(<TrustStrip />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(TRUST_INDICATORS.length);
  });
});
