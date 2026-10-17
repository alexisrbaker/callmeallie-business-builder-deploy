import { dbFrom } from '../../../lib/db.js';
const reply=(state)=>new Response(JSON.stringify(state),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function inspect(db,required){
 if(!db)return {binding:false};
 try{
  const names=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name);
  const missingTables=required.filter(n=>!names.includes(n));
  const cols={};
  for(const [table,wanted] of Object.entries({users:['is_owner','password_hash','email','status'],sessions:['expires_at','user_id']})){
   if(names.includes(table)){
    const rows=(await db.prepare('PRAGMA table_info('+table+')').all()).results||[];
    cols[table]=wanted.filter(n=>!rows.some(r=>r.name===n));
   }
  }
  return {binding:true,ready:missingTables.length===0&&Object.values(cols).every(a=>a.length===0),missingTables,missingColumns:cols};
 }catch(e){console.error('auth preflight',e);return {binding:true,ready:false,queryFailed:true}}
}
export const GET=async({locals})=>{
 const business=await inspect(dbFrom(locals),['users','sessions','site_settings','quiz_attempts','quiz_results','entitlements']);
 const shared=Boolean(locals?.runtime?.env?.IDENTITY_DB);
 let identity={configured:shared};
 if(shared){
  try{
   const d=locals.runtime.env.IDENTITY_DB;
   const names=(await d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions')").all()).results.map(r=>r.name);
   identity={configured:true,tablesReady:names.includes('users')&&names.includes('sessions')};
  }catch(e){console.error('shared identity preflight',e);identity={configured:true,tablesReady:false}}
 }
 return reply({business,identity,diagnostic:'Read-only account storage preflight; no personal information returned.'});
};