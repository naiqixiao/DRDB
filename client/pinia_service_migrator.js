const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'services');

fs.readdirSync(servicesDir).forEach(file => {
  if (!file.endsWith('.js')) return;
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Check if it imports the Vuex store
  if (!content.includes('import store from "@/store"')) {
    // If it has // import store from "@/store"; like in realtimeUpdate.js
    if (content.includes('// import store from "@/store";')) {
      content = content.replace('// import store from "@/store";', '');
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up commented import in ${file}`);
    }
    return;
  }
  
  // 2. Replace the import
  content = content.replace(
    'import store from "@/store";',
    'import { useMainStore } from "@/stores/mainStore";'
  );
  
  // 3. For api.js which is export default () => {
  if (file === 'api.js') {
    content = content.replace(
      'export default () => {\n',
      'export default () => {\n    const store = useMainStore();\n'
    );
    content = content.replace(/store\.state\./g, 'store.');
    fs.writeFileSync(filePath, content);
    console.log(`Migrated ${file}`);
    return;
  }
  
  // 4. For standard services structured as export default { method1() {}, method2() {} }
  // We need to insert `const store = useMainStore();` inside each method that uses `store.state.`
  
  // A regex to match method declarations inside the export default object
  // Looking for: functionName(args) { ... store.state. ... } or async functionName(args) { ... store.state. ... }
  // Since we know the codebase, we can just replace `store.state.` with `const store = useMainStore();\n    store.`
  // A safer approach: parse methods or just regex safely.
  
  // Let's just do a simple line-by-line replacement. If a line has store.state. we inject the store.
  // Actually, wait, useMainStore() can be called anywhere inside the function body.
  const lines = content.split('\n');
  let insideExportDefault = false;
  let currentFunctionStart = -1;
  let functionUsesStore = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export default {')) {
      insideExportDefault = true;
      continue;
    }
    
    // We can just use an AST parser or a smarter regex. Let's do a simpler regex.
    // Instead of parsing perfectly, let's just insert const store = useMainStore(); right after `{` if the block eventually uses store.state.
    // Given the risk of regex, let's just rely on a simpler transformation:
    // Replace `store.state.` with `useMainStore().` directly!
    // This is valid Pinia! `useMainStore().token` works perfectly inside functions.
  }
  
  // Wait, `useMainStore().token` is perfectly valid as long as it's evaluated lazily inside the function/method.
  // We don't even need to declare `const store = useMainStore()`.
  
  content = content.replace(/store\.state\./g, 'useMainStore().');
  
  fs.writeFileSync(filePath, content);
  console.log(`Migrated ${file}`);
});
