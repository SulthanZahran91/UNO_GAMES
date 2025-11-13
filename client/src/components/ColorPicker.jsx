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
    <div style={{
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
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '90%',
      }}>
        <h2 style={{
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '24px',
        }}>
          Choose a Color
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px',
        }}>
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                console.log('🎨 Color selected:', color.name);
                onColorSelect(color.name);
              }}
              style={{
                background: color.color,
                color: 'white',
                border: '3px solid white',
                borderRadius: '8px',
                padding: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {color.display}
            </button>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
