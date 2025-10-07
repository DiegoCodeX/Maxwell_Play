import React from "react";

type Props = { x?: number; y?: number };

const Frame: React.FC<Props> = ({ x=220, y=120 }) => (
  <g id="frame" transform={`translate(${x},${y})`}>
    <defs>
      <linearGradient id="tube" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#263238"/><stop offset="100%" stopColor="#37474f"/>
      </linearGradient>
      <filter id="tubeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity=".35"/>
      </filter>
    </defs>
    {/* Tubos del cuadro (triángulo) */}
    <g stroke="url(#tube)" strokeWidth="10" strokeLinecap="round" filter="url(#tubeGlow)">
      <path d="M60 180 L250 80 L340 160 L250 250 L140 250 Z" fill="none"/>
      <path d="M250 80 L220 50" />
      <path d="M340 160 L380 140" />
    </g>
    {/* Manubrio y potencia */}
    <rect x="370" y="130" width="44" height="14" rx="6" fill="#8e44ad"/>
    {/* Ejes (objetivos) */}
    <circle id="axleFront" cx="120" cy="250" r="10" fill="#27ae60"/>
    <circle id="axleRear"  cx="320" cy="250" r="10" fill="#27ae60"/>
    <circle id="axleFrontGlow" className="targetGlow" cx="120" cy="250" r="22" fill="none" stroke="#fff" strokeWidth={4}/>
    <circle id="axleRearGlow"  className="targetGlow" cx="320" cy="250" r="22" fill="none" stroke="#fff" strokeWidth={4}/>
  </g>
);

export default Frame;
