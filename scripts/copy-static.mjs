import fs from 'node:fs';
for (const [src,dest] of [['public','.next/standalone/public'],['.next/static','.next/standalone/.next/static']]) {
 if(fs.existsSync(src)) {fs.mkdirSync(dest,{recursive:true});fs.cpSync(src,dest,{recursive:true});}
}
