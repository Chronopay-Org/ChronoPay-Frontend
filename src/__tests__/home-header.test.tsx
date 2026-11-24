import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '../app/page';

describe('Home page header', () => {
  it('leaves the shared header and navigation to the root layout', () => {
    const { container } = render(<Home />);

    expect(container.querySelector('header')).toBeNull();
    expect(container.querySelector('nav[aria-label="Primary"]')).toBeNull();
    expect(container.querySelectorAll('main#main-content')).toHaveLength(1);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('a[href="https://github.com/Chronopay-Org/ChronoPay-Frontend"]')).toBeNull();
  });
});