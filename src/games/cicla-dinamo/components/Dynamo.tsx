import React from "react";

type Props = { x: number; y: number; className?: string };

const Dynamo: React.FC<Props> = ({ x, y, className="" }) => (
  <g id="dynamo" className={className} transform={`translate(${x},${y})`}>
    <defs>
      <linearGradient id="dynBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2c3e50"/><stop offset="100%" stopColor="#1f2a36"/>
      </linearGradient>
      <radialGradient id="steel">
        <stop offset="0%" stopColor="#e0e0e0"/><stop offset="100%" stopColor="#9e9e9e"/>
      </radialGradient>
    </defs>
    <rect x="-30" y="-18" width="60" height="36" rx="8" fill="url(#dynBody)" stroke="#34495e" strokeWidth={3}/>
    {/* Rodillo derecho */}
    <circle id="dynRoller" cx="35" cy="0" r="10" fill="url(#steel)" stroke="#95a5a6" strokeWidth={3}/>
    {/* Bornes */}
    <circle id="dynPlus"  cx="-18" cy="-24" r="7" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
    <circle id="dynMinus" cx=" 18" cy="-24" r="7" fill="#34495e" stroke="#fff" strokeWidth={2}/>
    <text x="-28" y="-34" fill="#fff" fontSize={11} fontWeight={700}>+</text>
    <text x="8"   y="-34" fill="#fff" fontSize={11} fontWeight={700}>–</text>
    <circle id="dynPlusGlow"  className="targetGlow" cx="-18" cy="-24" r="17" fill="none" stroke="#fff" strokeWidth={4}/>
    <circle id="dynMinusGlow" className="targetGlow" cx=" 18" cy="-24" r="17" fill="none" stroke="#fff" strokeWidth={4}/>
  </g>
);

export default Dynamo;
