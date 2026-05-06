const fs = require('fs');
const files = [
  'src/features/tools/pen.ts',
  'src/features/tools/shapes.ts',
  'src/features/toolbar/components/Toolbar.tsx',
  'src/features/canvas/components/Canvas.tsx',
  'src/features/canvas/hooks/useCanvasEvents.ts',
  'src/features/canvas/hooks/useKeyboardShortcuts.ts',
  'src/shared/ui/Ruler.tsx',
  'src/shared/ui/BoardImage.tsx',
  'src/app/workspace/WorkspacePage.tsx',
  'src/api/cloudinary.service.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Replace only the first block comment if it occurs before the first actual code block (to be safe)
  // Actually, we know from the head output that they are all at the very top.
  content = content.replace(/\/\*\*[\s\S]*?\*\/\n*/, '');
  fs.writeFileSync(file, content);
  console.log('Cleaned ' + file);
}
