const fs = require('fs');
let code = fs.readFileSync('src/lib/highlighter.ts', 'utf8');

code = code.replace(
  "    const regex = new RegExp(`\\\\b(${verb})\\\\b`, 'gi');",
  "    const escapedVerb = verb.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n    const regex = new RegExp(`\\\\b(${escapedVerb})\\\\b`, 'gi');"
);

// wait, if I use a script to replace, it's better to use the correct regex: /[.*+?^${}()|[\]\\]/g and '\\$&'

code = code.replace(
  /const regex = new RegExp\(`\\\\b\(\$\{verb\}\)\\\\b`, 'gi'\);/,
  "const escapedVerb = verb.replace(/[.*+?^${}()|[\\]\\\\\\\\]/g, '\\\\$&');\n    const regex = new RegExp(`\\\\b(${escapedVerb})\\\\b`, 'gi');"
);

fs.writeFileSync('src/lib/highlighter.ts', code);
