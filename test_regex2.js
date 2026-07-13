const str = "Art. 1º";
console.log(str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));
console.log(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
