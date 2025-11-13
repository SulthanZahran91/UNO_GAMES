/**
 * Color Picker Modal
 * Allows player to choose a color when playing Wild cards
 */

const COLORS = [
  { name: 'red', display: 'Red', color: '#ff5555' },
  { name: 'blue', display: 'Blue', color: '#5555ff' },
  { name: 'green', display: 'Green', color: '#55aa55' },
  { name: 'yellow', display: 'Yellow', color: '#ffaa00' },
];

export default function ColorPicker({ onColorSelect, onCancel }) {
  console.log('🎨 ColorPicker opened');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-picker-title"
    >
      <div style={{
        background: 'linear-gradient(135deg, #2d2d2d 0%, #404040 100%)',
        padding: '1.875rem',
        borderRadius: '0.75rem',
        maxWidth: '25rem',
        width: '100%',
        boxShadow: '0 1.25rem 3.125rem rgba(0, 0, 0, 0.8)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
      }}>
        <h2
          id="color-picker-title"
          style={{
            marginBottom: '1.25rem',
            textAlign: 'center',
            fontSize: '1.5rem',
          }}
        >
          Choose a Color
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.9375rem',
          marginBottom: '1.25rem',
        }}>
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                console.log('🎨 Color selected:', color.name);
                onColorSelect(color.name);
              }}
              aria-label={`Select ${color.display} color`}
              style={{
                background: color.color,
                color: 'white',
                border: '0.1875rem solid white',
                borderRadius: '0.5rem',
                padding: '1.25rem',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 0.25rem 0.375rem rgba(0, 0, 0, 0.3)',
                minHeight: 'var(--touch-target-min)',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {color.display}
            </button>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            aria-label="Cancel color selection"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '0.125rem solid rgba(255, 255, 255, 0.5)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minHeight: 'var(--touch-target-min)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
