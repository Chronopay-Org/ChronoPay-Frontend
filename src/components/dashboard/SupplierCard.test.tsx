import { render, screen } from '@testing-library/react';
import { SupplierCard } from './card';

describe('SupplierCard', () => {
  it('renders correctly with required props', () => {
    render(<SupplierCard name="Test Supplier" />);
    expect(screen.getByText('Test Supplier')).toBeInTheDocument();
  });

  it('renders with all optional props', () => {
    render(
      <SupplierCard
        name="John Doe"
        title="Web Developer"
        priceFloor=""
        rating={4.8}
        reviewCount={120}
        responseTime="1 hr"
        nextSlot="Tomorrow 3 PM"
      />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Web Developer')).toBeInTheDocument();
    expect(screen.getByText('')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(120)')).toBeInTheDocument();
    expect(screen.getByText('1 hr')).toBeInTheDocument();
    expect(screen.getByText('Next: Tomorrow 3 PM')).toBeInTheDocument();
  });
});
