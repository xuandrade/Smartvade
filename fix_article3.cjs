const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');

code = code.replace(
  /\[\.\*\+\?\^\$\{\}\(\)\|\[\\\\\]\\\\\\\\\]\/g/g,
  "[.*+?^${}()|[\\]\\\\]/g" // wait, this was what I did before. 
);
fs.writeFileSync('src/components/ArticleCard.tsx', code);
