import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

// Path to original SVG
const svgPath = path.join(process.cwd(), 'assets', 'image.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Load SVG as XML
const $ = cheerio.load(svgContent, { xmlMode: true });

// Annotate each <path> with id and colored fill for visual debugging
$('path').each((i: number, el: cheerio.Element) => {
  // Assign a unique id based on index
  $(el).attr('id', `path-${i}`);
  // Assign a distinct fill color for visual debugging
  $(el).attr('fill', `hsl(${(i * 137.508) % 360}, 80%, 60%)`);
});

// Output annotated SVG to new file
const outputPath = path.join(process.cwd(), 'assets', 'image-annotated.svg');
fs.writeFileSync(outputPath, $.xml(), 'utf8');
console.log(`Annotated SVG saved to ${outputPath}`); 