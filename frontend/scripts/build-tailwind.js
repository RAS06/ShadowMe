const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

async function build() {
  const infile = path.resolve(__dirname, '..', 'src', 'index.css');
  const outfileDir = path.resolve(__dirname, '..', 'dist', 'assets');
  const outfile = path.join(outfileDir, 'tailwind.css');

  if (!fs.existsSync(infile)) {
    console.error('input CSS not found:', infile);
    process.exit(1);
  }
  if (!fs.existsSync(outfileDir)) fs.mkdirSync(outfileDir, { recursive: true });

  const css = fs.readFileSync(infile, 'utf8');
  const result = await postcss([tailwindcss, autoprefixer]).process(css, { from: infile });
  fs.writeFileSync(outfile, result.css, 'utf8');
  console.log('Wrote', outfile);
}

build().catch(err => { console.error(err); process.exit(1); });
