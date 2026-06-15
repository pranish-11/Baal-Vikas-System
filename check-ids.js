const fs = require('fs');
const html = fs.readFileSync('axion-montessori-prototype (1).html', 'utf8');
const ids = [...html.matchAll(/id=['"]([^'"]+)['"]/g)].map(m => m[1]);
const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
console.log('Duplicates:', duplicates);
