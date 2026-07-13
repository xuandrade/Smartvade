const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');

code = code.split("replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')").join("replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')");
// Wait, actually, the original code IS /[.*+?^${}()|[\\]\\\\]/g
// Let's replace it with /[.*+?^${}()|[\\]\\\\]/g but wait... how many backslashes are actually needed?
// In Javascript literal regex: /[\]\\]/ is enough.
// So we want: `/[.*+?^${}()|[\\]\\\\]/g` to become `/[.*+?^${}()|[\\]\\\\]/g`?
// No, the exact string in the file is `replace(/[.*+?^${}()|[\\]\\\\]/g,` which has 4 backslashes for `]\\\\`?
