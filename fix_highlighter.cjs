const fs = require('fs');
let highlighter = fs.readFileSync('src/lib/highlighter.ts', 'utf8');

highlighter = highlighter.replace(
  "    const regex = new RegExp(`\\\\b(${verb})\\\\b`, 'gi');",
  () => "    const escapedVerb = verb.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n    const regex = new RegExp(`\\\\b(${escapedVerb})\\\\b`, 'gi');"
);
fs.writeFileSync('src/lib/highlighter.ts', highlighter);
