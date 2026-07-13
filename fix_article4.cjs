const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');

// The exact substring to replace
const findStr = "child.label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')";
const replaceStr = "child.label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')"; // wait, how to write [\]\\] in string?
// the file contains: `/[.*+?^${}()|[\\]\\\\]/g`
// we want it to contain: `/[.*+?^${}()|[\]\\]/g`

code = code.split("/[.*+?^${}()|[\\]\\\\]/g").join("/[.*+?^${}()|[\\]\\\\]/g");
// Wait, `[\\]` in JS string is `[\]`. So `/[\\]/` is `/[\]/`.
// `|[\]\\]/g` in JS string is `|[\\]\\\\]/g`.
// Wait, if I want the file to have `/[.*+?^${}()|[\]\\]/g`:
code = code.split("/[.*+?^${}()|[\\]\\\\]/g").join("/[.*+?^${}()|[\\]\\\\]/g");
fs.writeFileSync('src/components/ArticleCard.tsx', code);
