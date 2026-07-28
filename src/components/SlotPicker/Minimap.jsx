import React from 'react';

/**
 * Minimap Component
 * Displays a scaled visual overview of the slot grid.
 * 
 * @param {Array} slots - List of slot objects ({ id, status, x, y })
 * @param {Object} viewport - Current visible zone ({ x, y, width, height })
 * @param {Function} onPan - Callback fired when clicking/dragging the viewport box
 */
export const Minimap = ({ slots = [], viewport, onPan }) => {
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate percentage position
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
    >
      {/* Mini Slots Layer */}
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

      {/* Viewport Indicator Box */}
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

export default Minimap;
