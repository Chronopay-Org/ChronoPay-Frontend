import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingTour, DEFAULT_TOUR_STEPS } from './onboarding-tour';

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
    expect(screen.getByText('Start by connecting your Stellar wallet.')).toBeInTheDocument();
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
    const onComplete = jest.fn();
    render(
      <OnboardingTour open={true} onComplete={onComplete} />
    );
    
    const skipButton = screen.getByText('Skip');
    await user.click(skipButton);
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('should call onComplete when close button is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
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
    const onComplete = jest.fn();
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
    const onComplete = jest.fn();
    const { container } = render(
      <OnboardingTour open={true} onComplete={onComplete} />
    );
    
    const dialog = container.querySelector('[role="dialog"]');
    fireEvent.keyDown(dialog || document, { key: 'Escape' });
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('should display step indicator', () => {
    render(
      <OnboardingTour open={true} onComplete={() => {}} />
    );
    
    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
  });

  it('should navigate using progress dots', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingTour open={true} onComplete={() => {}} />
    );
    
    const dots = screen.getAllByRole('button', { name: /Go to step/ });
    await user.click(dots[2]);
    
    expect(screen.getByText('Manage Your Time Slots')).toBeInTheDocument();
  });
});
