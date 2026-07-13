const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');

// The original file has: /[.*+?^${}()|[\\]\\\\]/g
// Which is in JS string: "/[.*+?^${}()|[\\\\]\\\\\\\\]/g"
// We want: /[.*+?^${}()|[\]\\]/g
// Which is in JS string: "/[.*+?^${}()|[\\]\\\\]/g"

code = code.split('/[.*+?^${}()|[\\\\]\\\\\\\\]/g').join('/[.*+?^${}()|[\\\\]\\\\]/g');
// wait, [\]\\] -> in JS string: "[\\\\]\\\\]" (4 for first slash, 4 for second slash)
// So original: "[\\\\]\\\\\\\\]" (4 for first, 8 for second)

let count = 0;
code = code.replace(/\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\\\]\\\\\\\\\]\/g/g, () => {
    count++;
    return "/[.*+?^${}()|[\\\\]\\\\]/g";
});
console.log('Replaced', count, 'occurrences');

fs.writeFileSync('src/components/ArticleCard.tsx', code);
