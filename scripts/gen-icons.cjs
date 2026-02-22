const fs = require('fs');

function makeSVG(size) {
  const fontSize = Math.floor(size * 0.3);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg"',
    ` width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" fill="#0a0a0f"/>`,
    `  <text x="50%" y="50%" font-family="monospace" font-size="${fontSize}"`,
    '    fill="#7c3aed" text-anchor="middle" dominant-baseline="middle"',
    '    font-weight="bold">VW</text>',
    '</svg>',
  ].join('\n');
}

fs.writeFileSync('public/icons/icon-192.svg', makeSVG(192));
fs.writeFileSync('public/icons/icon-512.svg', makeSVG(512));
console.log('SVG icons created at public/icons/');
