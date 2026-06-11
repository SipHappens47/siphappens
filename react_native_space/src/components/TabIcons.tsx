import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

interface IconProps {
  color: string;
  size: number;
}

// Camera viewfinder: corner brackets, edge ticks, double circle in the center.
export function ScanIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Corner brackets */}
      <Path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      {/* Edge ticks */}
      <Line x1={12} y1={2.6} x2={12} y2={5.4} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1={12} y1={18.6} x2={12} y2={21.4} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1={2.6} y1={12} x2={5.4} y2={12} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1={18.6} y1={12} x2={21.4} y2={12} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      {/* Double circle */}
      <Circle cx={12} cy={12} r={4.4} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={2.6} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

// Three bottles side by side, each with a different label style.
export function ShelfIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left bottle: banded label */}
      <Path
        d="M3.6 3h1.8v3.6c1.4.5 2 1.4 2 2.8V21h-5.8V9.4c0-1.4.6-2.3 2-2.8V3z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Line x1={1.6} y1={12.4} x2={7.4} y2={12.4} stroke={color} strokeWidth={1.2} />
      <Line x1={1.6} y1={17.4} x2={7.4} y2={17.4} stroke={color} strokeWidth={1.2} />
      {/* Middle bottle: round label */}
      <Path
        d="M11.1 2.6h1.8v4.5c1.4.6 2 1.6 2 3V21h-5.8V10.1c0-1.4.6-2.4 2-3V2.6z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={14.6} r={1.7} stroke={color} strokeWidth={1.2} />
      {/* Right bottle: tall label */}
      <Path
        d="M18.6 2.2h1.8v4.9c1.5.7 2 1.8 2 3.2V21h-5.8V10.3c0-1.4.5-2.5 2-3.2V2.2z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Rect x={17.7} y={11.4} width={3.6} height={6.6} stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}
