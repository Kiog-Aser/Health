import fs from 'fs';
import path from 'path';
import React from 'react';

interface AnatomyTestPageProps {
  searchParams?: { highlight?: string };
}

export default function AnatomyTestPage({ searchParams }: AnatomyTestPageProps) {
  const highlightIndex = parseInt(searchParams?.highlight || '0', 10);
  const svgPath = path.join(process.cwd(), 'assets', 'image.svg');
  let svgContent = fs.readFileSync(svgPath, 'utf8');

  // Replace nth <path> fill with red
  let occ = 0;
  const modifiedSvg = svgContent.replace(/<path([^>]+)/g, (match, attrs) => {
    const idx = occ++;
    if (idx === highlightIndex) {
      // override fill attribute
      return `<path${attrs.replace(/fill="[^"]*"/, 'fill="#ef4444"')}`;
    }
    return match;
  });

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <h1 className="text-xl font-bold mb-4">Anatomy Highlight Test (path #{highlightIndex})</h1>
      <div
        className="overflow-auto"
        dangerouslySetInnerHTML={{ __html: modifiedSvg }}
      />
    </div>
  );
} 