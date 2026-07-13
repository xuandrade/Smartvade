const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');

// The incorrect string is: /[.*+?^${}()|[\\]\\\\]/g
// The correct one should be: /[.*+?^${}()|[\]\\]/g
// Let's replace the string.

code = code.replace(
  /\[\.\*\+\?\^\$\{\}\(\)\|\[\\\\\]\\\\\\\\\]/g,
  "[.*+?^${}()|[\\\\]\\\\\\\\]"
);

fs.writeFileSync('src/components/ArticleCard.tsx', code);
