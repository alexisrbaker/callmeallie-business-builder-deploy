import { dbFrom } from '../../../lib/db.js';
import { registerUser } from '../../../lib/auth.js';
import { claimAffiliateAttribution } from '../../../lib/affiliate-attribution.js';
const err=(message,status)=>new Response(message,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
export const POST=async({request,locals,cookies})=>{
 try{
  const db=dbFrom(locals);
  if(!db)return err('Business database is not connected.',503);
  const rows=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions')").all()).results||[];
  if(!['users','sessions'].every(x=>rows.some(r=>r.name===x)))return err('Account tables have not been created. The site owner needs to apply D1 migrations.',503);
  const form=await request.formData();
  const email=String(form.get('email')||'').trim().toLowerCase(),name=String(form.get('name')||'').trim(),password=String(form.get('password')||'');
  const requested=String(form.get('next')||'/account');
  const next=requested.startsWith('/')&&!requested.startsWith('//')&&!requested.includes('\\')?requested:'/account';
  if(!email||password.length<10)return err('Enter an email and password of at least 10 characters.',400);
  let auth;
  try{auth=await registerUser(db,request,locals,email,name,password)}
  catch(e){console.error('Account registration failure',e);if(e?.message==='account_exists')return err('This email already has an account. Please sign in.',409);return err('Account creation could not complete. Check the business and shared identity database setup.',503)}
  try{await claimAffiliateAttribution(db,cookies,auth.user.id)}catch(e){console.warn('Optional affiliate attribution skipped',e)}
  return new Response(null,{status:303,headers:{Location:next,'Set-Cookie':auth.cookie,'Cache-Control':'no-store'}});
 }catch(e){console.error('Unexpected account registration error',e);return err('Account registration encountered a database or service error.',503)}
};