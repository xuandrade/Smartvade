const fs = require('fs');

// Fix highlighter.ts
let highlighter = fs.readFileSync('src/lib/highlighter.ts', 'utf8');
highlighter = highlighter.replace(
  "    const regex = new RegExp(`\\\\b(${verb})\\\\b`, 'gi');",
  "    const escapedVerb = verb.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');\n    const regex = new RegExp(`\\\\b(${escapedVerb})\\\\b`, 'gi');"
);
fs.writeFileSync('src/lib/highlighter.ts', highlighter);

// Fix ArticleCard.tsx
let articleCard = fs.readFileSync('src/components/ArticleCard.tsx', 'utf8');
articleCard = articleCard.replace(
  /\[\.\*\+\?\^\$\{\}\(\)\|\[\\\\\]\\\\\\\\\]\/g/g,
  "[.*+?^${}()|[\\\\]\\\\\\\\]/g" // wait, let's just rewrite the line instead
);
fs.writeFileSync('src/components/ArticleCard.tsx', articleCard);
