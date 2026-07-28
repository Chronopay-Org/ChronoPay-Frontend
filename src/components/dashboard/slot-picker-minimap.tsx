import React from 'react';

export interface MinimapSlot {
  id: string;
  status: 'available' | 'reserved' | 'selected';
}

export interface MinimapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SlotPickerMinimapProps {
  slots?: MinimapSlot[];
  viewport?: MinimapViewport;
  onPan?: (position: { targetXRatio: number; targetYRatio: number }) => void;
}

export const SlotPickerMinimap: React.FC<SlotPickerMinimapProps> = ({
  slots = [],
  viewport,
  onPan,
}) => {
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetXRatio = clickX / rect.width;
    const targetYRatio = clickY / rect.height;

    if (onPan) {
      onPan({ targetXRatio, targetYRatio });
    }
  };

  return (
    <div
      className="relative w-48 h-32 bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden cursor-pointer select-none shadow-md hover:border-slate-500 transition-colors"
      onClick={handleMapClick}
      data-testid="slot-picker-minimap"
    >
      <div className="absolute inset-0 p-2 grid grid-cols-6 gap-1 opacity-60 pointer-events-none">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`rounded-sm transition-colors ${
              slot.status === 'selected'
                ? 'bg-emerald-500'
                : slot.status === 'reserved'
                ? 'bg-rose-500'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {viewport && (
        <div
          className="absolute border-2 border-emerald-400 bg-emerald-400/20 rounded pointer-events-none transition-all duration-75"
          style={{
            left: `${viewport.x}%`,
            top: `${viewport.y}%`,
            width: `${viewport.width}%`,
            height: `${viewport.height}%`,
          }}
        />
      )}
    </div>
  );
};

export default SlotPickerMinimap;
