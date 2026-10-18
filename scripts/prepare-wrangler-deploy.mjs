import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const entry='./dist/server/entry.mjs';
if(!existsSync(entry)) throw new Error('Astro server entry was not generated: '+entry);
for(const file of ['wrangler.allie.toml','wrangler.toml']){
 if(!existsSync(file))continue;
 const raw=readFileSync(file,'utf8');
 const fixed=raw.replace(/^main\s*=\s*"@astrojs\/cloudflare\/entrypoints\/server"/m,'main = "'+entry+'"');
 if(fixed===raw && !raw.includes('main = "'+entry+'"'))throw new Error('Could not locate worker main field in '+file);
 writeFileSync(file,fixed);
 console.log('Prepared '+file+' for Wrangler deployment');
}
