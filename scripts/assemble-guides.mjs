import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const guides = Array.from({length:46}, (_,i) => JSON.parse(readFileSync(join(root,'src','data','guides',String(i+1).padStart(2,'0')+'.json'),'utf8')));
if (guides.some((g,i)=>g.number!==i+1)) throw new Error('Guide numbering mismatch');
writeFileSync(join(root,'src','data','guides.json'), JSON.stringify(guides));
console.log('Prepared 46 guides for build');
