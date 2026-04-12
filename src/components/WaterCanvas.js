'use client';

export default function WaterCanvas({ style = {} }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        backgroundColor: '#C8D8D5',
        ...style,
      }}
    >
      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(8%, -12%) scale(1.08); }
          66% { transform: translate(-6%, 8%) scale(0.95); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(-10%, 6%) scale(1.05); }
          66% { transform: translate(12%, -8%) scale(1.1); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(6%, 10%) scale(1.06); }
        }
        @keyframes drift4 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          40% { transform: translate(-8%, -6%) scale(0.94); }
          80% { transform: translate(4%, 12%) scale(1.04); }
        }
        @keyframes drift5 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          60% { transform: translate(10%, -10%) scale(1.07); }
        }
        .wc-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
        }
      `}</style>

      <div className="wc-blob" style={{
        width: '70vw', height: '70vw',
        top: '-20%', left: '-15%',
        backgroundColor: 'rgba(180, 210, 205, 0.7)',
        animation: 'drift1 18s ease-in-out infinite',
      }} />
      <div className="wc-blob" style={{
        width: '60vw', height: '60vw',
        top: '10%', right: '-20%',
        backgroundColor: 'rgba(160, 198, 193, 0.6)',
        animation: 'drift2 22s ease-in-out infinite',
      }} />
      <div className="wc-blob" style={{
        width: '50vw', height: '50vw',
        bottom: '-15%', left: '20%',
        backgroundColor: 'rgba(200, 220, 218, 0.65)',
        animation: 'drift3 16s ease-in-out infinite',
      }} />
      <div className="wc-blob" style={{
        width: '40vw', height: '40vw',
        top: '30%', left: '30%',
        backgroundColor: 'rgba(201, 169, 110, 0.15)',
        animation: 'drift4 24s ease-in-out infinite',
      }} />
      <div className="wc-blob" style={{
        width: '45vw', height: '45vw',
        bottom: '5%', right: '5%',
        backgroundColor: 'rgba(170, 205, 200, 0.5)',
        animation: 'drift5 20s ease-in-out infinite',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} />
    </div>
  );
}
