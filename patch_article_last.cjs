const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');

// The original string we found using JSON.stringify:
const searchStr = "replace(/[.*+?^${}()|[\\\\]\\\\]/g, '\\\\\\\\$&')";
const targetStr = "replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')"; // wait, to get literal /[.*+?^${}()|[\]\\]/g, '\\$&'
// JS string literal for `/[.*+?^${}()|[\]\\]/g`: "/[.*+?^${}()|[\\]\\\\]/g"
// JS string literal for `'\\$&'`: "'\\\\$&'"

code = code.split(searchStr).join("replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')");

fs.writeFileSync('src/components/ArticleCard.tsx', code);
console.log('Done replacing ArticleCard.tsx');
