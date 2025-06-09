'use client';
import React, { useEffect, useRef } from 'react';

interface InteractiveSvgDebuggerProps {
  rawSvg: string;
}

export default function InteractiveSvgDebugger({ rawSvg }: InteractiveSvgDebuggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inline the raw SVG markup
    containerRef.current.innerHTML = rawSvg;

    // Select all paths inside the SVG
    const paths = containerRef.current.querySelectorAll('path') as NodeListOf<SVGPathElement>;

    paths.forEach((pathEl, index) => {
      // Ensure each path has an id
      const id = pathEl.id || `path-${index}`;
      pathEl.id = id;

      // Inject a <title> for hover tooltip
      if (!pathEl.querySelector('title')) {
        const titleEl = document.createElement('title');
        titleEl.textContent = id;
        pathEl.prepend(titleEl);
      }

      // Style for debugging
      pathEl.style.cursor = 'pointer';
      pathEl.style.transition = 'opacity 0.2s';

      // Mouse events: highlight on hover
      pathEl.addEventListener('mouseenter', () => { pathEl.style.opacity = '0.6'; });
      pathEl.addEventListener('mouseleave', () => { pathEl.style.opacity = '1'; });

      // Click event: log id and dim others
      pathEl.addEventListener('click', () => {
        console.log(id);
        paths.forEach(p => { p.style.opacity = '0.3'; });
        pathEl.style.opacity = '1';
      });
    });
  }, [rawSvg]);

  return (
    <div className="p-6 bg-base-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Interactive Anatomy Debugger</h1>
      <div ref={containerRef} />
    </div>
  );
} 