// postbuild.js — Creates a root entry shim in server/dist/index.js
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const indexShim = path.join(distDir, 'index.js');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(indexShim, "// Auto-generated entry shim for production\nrequire('./server/src/index.js');\n");
