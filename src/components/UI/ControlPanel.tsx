import React from 'react';

interface ControlPanelProps {
  visible: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ visible, onFileUpload }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      transition: 'opacity 0.5s ease',
      opacity: visible ? 1 : 0,
    }}>
      <header style={{ marginTop: '48px', textAlign: 'center', userSelect: 'none' }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
          fontFamily: 'Cinzel, serif',
          fontWeight: 'bold',
          background: 'linear-gradient(to bottom, #ffffff, #d4af37)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.5))',
          marginBottom: '8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Merry Christmas
        </h1>
        <p style={{
          color: '#fceea7',
          opacity: 0.6,
          fontSize: '12px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          A Generative Holiday Experience
        </p>
      </header>

      <div style={{
        marginTop: 'auto',
        marginBottom: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        pointerEvents: 'auto',
      }}>
        <label style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #d4af37',
          color: '#d4af37',
          fontFamily: 'Cinzel, serif',
          padding: '12px 32px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderRadius: '9999px',
        }}>
          Add Memories
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={onFileUpload} 
            style={{ display: 'none' }} 
          />
        </label>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Press 'H' to Hide Controls
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '9px', textTransform: 'uppercase' }}>
            Fist: Tree | Open Hand: Scatter | Pinch: Focus
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;