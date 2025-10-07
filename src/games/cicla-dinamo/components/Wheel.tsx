import React from "react";

type Props = {
  id: string;
  x: number;
  y: number;
  radius?: number;        // radio exterior (llanta)
  className?: string;     // "wheel" para drag
  withContact?: boolean;  // si es la trasera, muestra punto de contacto
};

const Wheel: React.FC<Props> = ({ id, x, y, radius = 52, className="", withContact }) => {
  const rim = radius - 8;     // aro
  const hub = 10;             // maza
  const spokes = 16;          // radios
  return (
    <g id={id} className={className} transform={`translate(${x},${y})`}>
      <defs>
        <radialGradient id={`${id}-tire`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#3a3a3a"/><stop offset="100%" stopColor="#111"/>
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#cfd8dc"/><stop offset="100%" stopColor="#90a4ae"/>
        </radialGradient>
        <radialGradient id={`${id}-hub`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#eceff1"/><stop offset="100%" stopColor="#b0bec5"/>
        </radialGradient>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodOpacity="0.35"/>
        </filter>
      </defs>

      <g className="rotor" filter={`url(#${id}-shadow)`}>
        {/* Cubierta (llanta) con leve textura */}
        <circle cx="0" cy="0" r={radius} fill={`url(#${id}-tire)`} />
        <circle cx="0" cy="0" r={radius-2} fill="none" stroke="#000" strokeOpacity=".25"/>
        {/* Aro metálico */}
        <circle cx="0" cy="0" r={rim} fill={`url(#${id}-rim)`} />
        <circle cx="0" cy="0" r={rim-2} fill="#263238"/>
        {/* Radios */}
        <g stroke="#cfd8dc" strokeWidth="2" opacity=".95">
          {Array.from({length: spokes}).map((_,i)=>{
            const a = (i * 360/spokes) * Math.PI/180;
            const x1 = Math.cos(a)* (rim-3), y1 = Math.sin(a)* (rim-3);
            const x2 = Math.cos(a)* hub,     y2 = Math.sin(a)* hub;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
        </g>
        {/* Maza */}
        <circle cx="0" cy="0" r={hub} fill={`url(#${id}-hub)`} stroke="#90a4ae"/>
        {/* Disco freno sutil (detalle estético) */}
        <circle cx="0" cy="0" r={hub+6} fill="none" stroke="#b0bec5" strokeDasharray="2 4" opacity=".5"/>
        {/* Punto de contacto para dínamo (rueda trasera, izquierda) */}
        {withContact && (
          <>
            <circle id="rearContact" cx={-radius-10} cy="0" r="8" fill="#27ae60"/>
            <circle id="rearContactGlow" className="targetGlow" cx={-radius-10} cy="0" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
          </>
        )}
      </g>
    </g>
  );
};

export default Wheel;
