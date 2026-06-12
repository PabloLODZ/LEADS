import { useEffect, useState } from 'react';

const MESSAGES = [
  'Conectando ao Google Maps...',
  'Mapeando a região...',
  'Identificando estabelecimentos...',
  'Analisando perfis comerciais...',
  'Calculando scores de qualificação...',
  'Filtrando leads de alta conversão...',
  'Coletando dados de contato...',
  'Organizando resultados...',
  'Quase lá...',
];

export default function LeadCaptureLoader({ segment, location, count }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState([]);
  const [progress, setProgress] = useState(0);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length);
      setProgress(prev => Math.min(prev + Math.random() * 14 + 4, 92));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Animate radar dots appearing
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newDots = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
        id: Date.now() + i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 50,
        size: 4 + Math.random() * 6,
        opacity: 0.7 + Math.random() * 0.3,
        delay: Math.random() * 0.5,
      }));
      setDots(prev => [...prev.slice(-12), ...newDots]);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [msgIndex]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '28px', maxWidth: '480px', width: '100%', padding: '0 24px',
      }}>

        {/* Radar / Map Animation */}
        <div style={{ position: 'relative', width: '220px', height: '220px' }}>

          {/* Radar rings */}
          {[1, 2, 3].map(r => (
            <div key={r} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${r * 60}px`, height: `${r * 60}px`,
              borderRadius: '50%',
              border: `1px solid rgba(0, 255, 150, ${0.35 - r * 0.08})`,
              animation: `radarPulse ${2 + r * 0.4}s ease-in-out infinite`,
              animationDelay: `${r * 0.3}s`,
            }} />
          ))}

          {/* Spinning radar sweep */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '160px', height: '160px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 75%, rgba(0, 255, 130, 0.25) 100%)',
            animation: 'radarSweep 2.4s linear infinite',
          }} />

          {/* Center dot */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#00ff96',
            boxShadow: '0 0 16px #00ff96, 0 0 32px rgba(0,255,150,0.4)',
          }} />

          {/* Lead dots appearing */}
          {dots.map(dot => (
            <div key={dot.id} style={{
              position: 'absolute',
              left: `${dot.x}%`, top: `${dot.y}%`,
              width: `${dot.size}px`, height: `${dot.size}px`,
              borderRadius: '50%',
              background: '#00ff96',
              boxShadow: `0 0 ${dot.size * 2}px rgba(0,255,150,0.8)`,
              opacity: dot.opacity,
              animation: `dotAppear 0.4s ease-out ${dot.delay}s both`,
            }} />
          ))}

          {/* Map grid lines (subtle) */}
          <svg style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0.08,
          }}>
            {[30, 50, 70, 90, 110, 130, 150, 170, 190].map(v => (
              <g key={v}>
                <line x1={v} y1="0" x2={v} y2="220" stroke="#00ff96" strokeWidth="0.5" />
                <line x1="0" y1={v} x2="220" y2={v} stroke="#00ff96" strokeWidth="0.5" />
              </g>
            ))}
          </svg>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '22px', fontWeight: '700',
            color: '#fff', margin: '0 0 8px 0',
            letterSpacing: '-0.3px',
          }}>
            Garimpando Leads
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>
            {segment && location ? `${segment} em ${location}` : 'Buscando no Google Maps...'}
          </p>
        </div>

        {/* Animated message */}
        <div style={{
          background: 'rgba(0, 255, 150, 0.08)',
          border: '1px solid rgba(0, 255, 150, 0.2)',
          borderRadius: '12px', padding: '14px 24px',
          minWidth: '320px', textAlign: 'center',
          minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{
            color: '#00ff96', margin: 0, fontSize: '14px', fontWeight: '500',
            animation: 'fadeMsg 0.5s ease',
            key: msgIndex,
          }}>
            {MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Processando</span>
            <span style={{ fontSize: '12px', color: '#00ff96', fontWeight: '600' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            height: '4px', borderRadius: '99px',
            background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00c97a, #00ff96)',
              transition: 'width 1.8s ease',
              boxShadow: '0 0 10px rgba(0,255,150,0.5)',
            }} />
          </div>
        </div>

        {/* Lead count indicator */}
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          color: 'rgba(255,255,255,0.4)', fontSize: '13px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#00ff96',
            animation: 'blink 1s ease-in-out infinite',
          }} />
          Buscando até {count} leads qualificados
        </div>

        <style>{`
          @keyframes radarSweep {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes radarPulse {
            0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.04); }
          }
          @keyframes dotAppear {
            from { opacity: 0; transform: scale(0); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes fadeMsg {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
