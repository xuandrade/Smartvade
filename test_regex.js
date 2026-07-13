try {
  console.log("()".replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  console.log("()".replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));
} catch (e) {
  console.error(e);
}
