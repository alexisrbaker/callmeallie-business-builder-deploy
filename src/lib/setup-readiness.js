import { dbFrom, identityDbFrom } from './db.js';
export async function setupReadiness(locals){
 const db=dbFrom(locals), shared=Boolean(identityDbFrom(locals));
 if(!db)return {ready:false,shared,missing:['D1 DB binding'],message:'Connect the website database.'};
 const required=['users','sessions','site_settings','entitlements','quiz_attempts','quiz_results'];
 try{
  const rows=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results||[];
  const names=new Set(rows.map(r=>r.name));
  const missing=required.filter(n=>!names.has(n));
  if(names.has('users')){
   const cols=(await db.prepare("PRAGMA table_info(users)").all()).results||[];
   if(!cols.some(c=>c.name==='is_owner'))missing.push('users.is_owner');
  }
  return {ready:missing.length===0,shared,missing,message:missing.length?'Database setup is incomplete. Apply the bundled D1 migrations before creating accounts.':'Database is ready for account setup.'};
 }catch(e){console.error('setup readiness',e);return {ready:false,shared,missing:['database access'],message:'The website database is not responding.'}}
}