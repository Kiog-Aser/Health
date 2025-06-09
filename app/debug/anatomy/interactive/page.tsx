import fs from 'fs';
import path from 'path';
import React from 'react';
import InteractiveSvgDebugger from './InteractiveSvgDebugger';

export default function AnatomyInteractivePage() {
  const svgPath = path.join(process.cwd(), 'assets', 'image.svg');
  const rawSvg = fs.readFileSync(svgPath, 'utf8');

  return <InteractiveSvgDebugger rawSvg={rawSvg} />;
} 