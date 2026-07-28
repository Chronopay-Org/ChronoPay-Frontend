import { render, screen, fireEvent } from '@testing-library/react';
import { SlotPickerMinimap, MinimapSlot, MinimapViewport } from './slot-picker-minimap';

describe('SlotPickerMinimap Component', () => {
  const mockSlots: MinimapSlot[] = [
    { id: '1', status: 'available' },
    { id: '2', status: 'reserved' },
    { id: '3', status: 'selected' },
  ];

  const mockViewport: MinimapViewport = { x: 10, y: 10, width: 40, height: 40 };

  test('renders minimap container', () => {
    render(<SlotPickerMinimap slots={mockSlots} viewport={mockViewport} />);
    expect(screen.getByTestId('slot-picker-minimap')).toBeInTheDocument();
  });

  test('triggers onPan callback on click', () => {
    const handlePan = jest.fn();
    render(<SlotPickerMinimap slots={mockSlots} viewport={mockViewport} onPan={handlePan} />);

    const minimap = screen.getByTestId('slot-picker-minimap');
    fireEvent.click(minimap, { clientX: 50, clientY: 50 });

    expect(handlePan).toHaveBeenCalledTimes(1);
  });
});
