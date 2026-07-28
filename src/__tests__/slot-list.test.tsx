import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next/navigation hooks used by SlotList
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => ({ get: (k: string) => (k === 'duration' ? '30' : null) }),
}));

import { SlotList } from '@/components/dashboard/slot-list';

describe('SlotList', () => {
  it('preselects duration from URL and shows filtered results', () => {
    render(<SlotList />);

    // The sample data contains a 30-minute slot "Founder office hours"
    expect(screen.getByText(/Founder office hours/i)).toBeTruthy();

    // Items that are not 30-minute should not be present (e.g. "Quick 15-minute intro")
    expect(screen.queryByText(/Quick 15-minute intro/i)).toBeNull();
  });
});
