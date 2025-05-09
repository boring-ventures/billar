// Generate placeholder images and logos
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const publicDir = path.join(__dirname, '../public');
const imagesDir = path.join(publicDir, 'images');
const logosDir = path.join(publicDir, 'logos');

// Create SVG placeholder logos
for (let i = 1; i <= 6; i++) {
  const logoPath = path.join(logosDir, `partner${i}.svg`);
  const color = `hsl(${(i * 60) % 360}, 70%, 80%)`;
  
  const svg = `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" fill="${color}" rx="8" />
    <text x="60" y="25" font-family="Arial" font-size="12" text-anchor="middle" fill="#555">Partner ${i}</text>
  </svg>`;
  
  fs.writeFileSync(logoPath, svg);
  console.log(`Created: ${logoPath}`);
}

// Create simple placeholder images for the billar hall and dashboard
const images = [
  { name: 'modern-billar-hall.jpg', color: '#3498db' },
  { name: 'billar-app-dashboard.jpg', color: '#2ecc71' },
  { name: 'billar-solution-diagram.jpg', color: '#e74c3c' },
  { name: 'testimonial-1.jpg', color: '#f39c12' },
  { name: 'testimonial-2.jpg', color: '#9b59b6' },
  { name: 'testimonial-3.jpg', color: '#16a085' }
];

// Use Node.js to generate SVGs with the right dimensions that can be served as placeholders
images.forEach(img => {
  const imgPath = path.join(imagesDir, img.name);
  // If image already exists, don't overwrite
  if (fs.existsSync(imgPath)) {
    console.log(`Skipping existing image: ${imgPath}`);
    return;
  }
  
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="600" fill="${img.color}" />
    <text x="400" y="300" font-family="Arial" font-size="30" text-anchor="middle" fill="white">${img.name}</text>
  </svg>`;
  
  // Save as SVG file with .jpg extension (for development purposes)
  fs.writeFileSync(imgPath, svg);
  console.log(`Created: ${imgPath}`);
});

console.log('All placeholder images and logos generated successfully!'); 