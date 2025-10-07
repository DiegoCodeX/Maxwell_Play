import React from "react";

type Props = { x: number; y: number };

const Bulb: React.FC<Props> = ({ x, y }) => (
  <g id="bulb" transform={`translate(${x},${y})`}>
    <defs>
      <radialGradient id="gBulb" cx="50%" cy="35%">
        <stop offset="0%" stopColor="#f1c40f"/><stop offset="100%" stopColor="#f39c12"/>
      </radialGradient>
      <linearGradient id="socket" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#b0bec5"/><stop offset="100%" stopColor="#788d96"/>
      </linearGradient>
    </defs>
    <ellipse className="bulb-glass" cx="0" cy="0" rx="40" ry="55" fill="url(#gBulb)"/>
    <rect x="-18" y="50" width="36" height="26" rx="6" fill="url(#socket)" stroke="#7f8c8d" strokeWidth={3}/>
    <circle id="bulbPlus"  cx="-12" cy="78" r="8" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
    <circle id="bulbMinus" cx=" 12" cy="78" r="8" fill="#34495e" stroke="#fff" strokeWidth={2}/>
    <text x="-30" y="98" fill="#fff" fontSize={12} fontWeight={700}>+</text>
    <text x="20"  y="98"  fill="#fff" fontSize={12} fontWeight={700}>–</text>
    <circle id="bulbPlusGlow"  className="targetGlow" cx="-12" cy="78" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
    <circle id="bulbMinusGlow" className="targetGlow" cx=" 12" cy="78" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
  </g>
);

export default Bulb;
