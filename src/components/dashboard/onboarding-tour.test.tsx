import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingTour } from './onboarding-tour';

describe('OnboardingTour', () => {
  beforeEach(() => {
    // Create target elements for the tour
    const walletCard = document.createElement('div');
    walletCard.setAttribute('data-tour-target', 'wallet-card');
    walletCard.style.width = '300px';
    walletCard.style.height = '200px';
    document.body.appendChild(walletCard);

    const quickActions = document.createElement('div');
    quickActions.setAttribute('data-tour-target', 'quick-actions');
    quickActions.style.width = '300px';
    quickActions.style.height = '200px';
    document.body.appendChild(quickActions);

    const slots = document.createElement('div');
    slots.setAttribute('data-tour-target', 'available-time-slots');
    slots.style.width = '300px';
    slots.style.height = '200px';
    document.body.appendChild(slots);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should not render when closed', () => {
    const { container } = render(
      <OnboardingTour open={false} onComplete={() => {}} />
    );
    
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    const { container } = render(
      <OnboardingTour open={true} onComplete={() => {}} />
    );
    
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  });

  it('should display first step on initial render', () => {
    render(
      <OnboardingTour open={true} onComplete={() => {}} />
    );
    
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    expect(
      screen.getByText(/Start by connecting your Stellar wallet\./)
    ).toBeInTheDocument();
  });

  it('should navigate to next step', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingTour open={true} onComplete={() => {}} />
    );
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should navigate to previous step', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <OnboardingTour open={true} onComplete={() => {}} key="1" />
    );
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Rerender to show new step
    rerender(
      <OnboardingTour open={true} onComplete={() => {}} key="2" />
    );
  });

  it('should call onComplete when skip is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <OnboardingTour open={true} onComplete={onComplete} />
    );
    
    const skipButton = screen.getByText('Skip');
    await user.click(skipButton);
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('should call onComplete when close button is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <OnboardingTour open={true} onComplete={onComplete} />
    );
    
    const closeButton = screen.getByLabelText('Close tour');
    await user.click(closeButton);
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('should show Finish button on last step', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingTour open={true} onComplete={() => {}} />
    );
    
    // Navigate to last step
    let nextButton = screen.getByText('Next');
    await user.click(nextButton);
    nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('should call onComplete when Finish is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <OnboardingTour open={true} onComplete={onComplete} />
    );
    
    // Navigate to last step
    let nextButton = screen.getByText('Next');
    await user.click(nextButton);
    nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    const finishButton = screen.getByText('Finish');
    await user.click(finishButton);
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('should close on Escape key', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingTour open={true} onComplete={onComplete} />);

    await user.keyboard("{Escape}");

    expect(onComplete).toHaveBeenCalled();
  });

  it('should not navigate when typing space in an input', async () => {
    const onComplete = vi.fn();
    render(<OnboardingTour open={true} onComplete={onComplete} />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    await new Promise((r) => setTimeout(r, 200));

    const evt = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    Object.defineProperty(evt, "target", { value: input, writable: false });
    window.dispatchEvent(evt);

    expect(screen.getByText("Connect Your Wallet")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    input.remove();
  });

  it('advances exactly one step with a single Space press on the focused Next button', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingTour open={true} onComplete={onComplete} />);

    const nextButton = screen.getByRole("button", { name: /Next/i });
    nextButton.focus();
    await user.keyboard(" ");

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
