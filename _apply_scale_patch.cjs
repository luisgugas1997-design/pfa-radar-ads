const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'app.js');
const patchPath = path.join(__dirname, '_scale_control_patch.js');

const content = fs.readFileSync(appPath, 'utf8');
const lines = content.split(/\r?\n/);

const startMarker = '// --- Gestor de Documentos: Central de Controle de Escala ---';
const start = lines.findIndex(l => l === startMarker);
if (start === -1) {
  console.error('Start marker not found');
  process.exit(1);
}

let end = start;
while (end < lines.length && !(lines[end] === '};' && lines[end + 1] === '' && end > start + 20)) {
  end++;
}
// Find triggerDocsFiltering closing
while (end < lines.length) {
  if (lines[end].startsWith('window.triggerDocsFiltering')) {
    while (end < lines.length && lines[end] !== '};') end++;
    end++;
    break;
  }
  end++;
}

const patch = fs.readFileSync(patchPath, 'utf8').replace(/\r?\n$/, '');
const newLines = [...lines.slice(0, start), ...patch.split(/\r?\n/), ...lines.slice(end)];
fs.writeFileSync(appPath, newLines.join('\n') + '\n', 'utf8');
console.log('Patched lines', start + 1, 'to', end, '->', patch.split(/\r?\n/).length, 'new lines');
