const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace toLocaleString("id-ID") with toLocaleString("id-ID", { maximumFractionDigits: 0 })
    // We only want to replace ones that don't already have options
    if (content.includes('toLocaleString("id-ID")')) {
      content = content.replace(/\.toLocaleString\("id-ID"\)/g, '.toLocaleString("id-ID", { maximumFractionDigits: 0 })');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
