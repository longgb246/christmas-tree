import React from 'react';

interface LoadingScreenProps {
  visible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
      transition: 'opacity 1s ease',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(212, 175, 55, 0.3)',
        borderTop: '4px solid #d4af37',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
      }} />
      
      <p style={{
        fontFamily: 'Cinzel, serif',
        letterSpacing: '0.2em',
        fontSize: '14px',
        color: '#d4af37',
        textTransform: 'uppercase',
      }}>
        Loading Holiday Magic
      </p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
