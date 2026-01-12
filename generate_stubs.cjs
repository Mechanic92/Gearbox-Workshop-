const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'src', 'components', 'ui');
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

const components = [
  'button', 'sheet', 'avatar', 'input', 'label', 'card', 'select', 
  'table', 'badge', 'dialog', 'dropdown-menu', 'calendar', 'popover', 
  'tabs', 'textarea', 'switch', 'form', 'separator', 'scroll-area', 
  'accordion', 'alert', 'progress', 'radio-group', 'checkbox', 'command',
  'tooltip', 'sonner'
];

const sharedClasses = {
  button: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2",
  input: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  card: "rounded-xl border bg-card text-card-foreground shadow",
  badge: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  textarea: "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
};

components.forEach(name => {
  const ComponentName = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const baseClass = sharedClasses[name] || "";
  
  const baseExports = [
    `${ComponentName}Trigger`,
    `${ComponentName}Content`,
    `${ComponentName}Header`,
    `${ComponentName}Footer`,
    `${ComponentName}Title`,
    `${ComponentName}Description`,
    `${ComponentName}Label`,
    `${ComponentName}Item`,
    `${ComponentName}Separator`,
    `${ComponentName}Group`,
    `${ComponentName}Value`,
    `${ComponentName}List`,
    `${ComponentName}Panel`,
    `${ComponentName}Portal`,
    `${ComponentName}Overlay`,
    `${ComponentName}Action`,
    `${ComponentName}Cancel`,
    `${ComponentName}Input`,
    `${ComponentName}Empty`,
    `${ComponentName}CheckboxItem`,
  ];

  const extraExportsMap = {
    'table': ['TableHeader', 'TableBody', 'TableFooter', 'TableHead', 'TableRow', 'TableCell', 'TableCaption'],
    'form': ['FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage'],
    'avatar': ['AvatarImage', 'AvatarFallback'],
    'tooltip': ['TooltipProvider'],
  };

  const extraExports = extraExportsMap[name] || [];
  const allUniqueExports = Array.from(new Set([...baseExports, ...extraExports]));

  let tag = 'div';
  if (name === 'button') tag = 'button';
  if (name === 'input') tag = 'input';
  if (name === 'label') tag = 'label';
  if (name === 'textarea') tag = 'textarea';

  let content = `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\n`;
  content += `export const ${ComponentName} = React.forwardRef<any, any>(({ className, children, ...props }, ref) => (\n  <${tag} ref={ref} className={cn("${baseClass}", className)} {...props}>\n    {children}\n  </${tag}>\n))\n${ComponentName}.displayName = "${ComponentName}"\n\n`;
  
  allUniqueExports.forEach(exp => {
    if (exp !== ComponentName) {
      content += `export const ${exp} = ${ComponentName}\n`;
    }
  });

  if (name === 'sonner') {
      content += `export const Toaster = () => null\n`;
  }

  fs.writeFileSync(path.join(uiDir, `${name}.tsx`), content);
});

console.log('Stubs updated (styled)');
