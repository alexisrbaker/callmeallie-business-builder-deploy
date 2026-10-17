import { dbFrom } from '../../../lib/db.js';
import { loginUser } from '../../../lib/auth.js';
import { claimAffiliateAttribution } from '../../../lib/affiliate-attribution.js';
const err=(message,status)=>new Response(message,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
export const POST=async({request,locals,cookies})=>{
 try{
  const db=dbFrom(locals);
  if(!db)return err('Business database binding is unavailable. Please contact the site administrator.',503);
  const form=await request.formData();
  const email=String(form.get('email')||'').trim().toLowerCase();
  const password=String(form.get('password')||'');
  const requested=String(form.get('next')||'/account');
  const next=requested.startsWith('/')&&!requested.startsWith('//')&&!requested.includes('\\')?requested:'/account';
  if(!email||!password)return err('Please enter your email and password.',400);
  // Never authenticate against an uninitialized business database.
  try {
   const rows=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions')").all();
   if(new Set((rows.results||[]).map(r=>r.name)).size!==2) return err('Account storage is not initialized. The website owner needs to apply the D1 database migrations.',503);
  }catch(e){console.error('Account DB preflight',e);return err('Account database is not ready. Please contact the site administrator.',503)}
  let auth;
  try{auth=await loginUser(db,request,locals,email,password)}
  catch(e){console.error('Authentication failed server-side',e);return err('Sign-in could not complete because the account database or shared identity integration is not ready.',503)}
  if(!auth)return err('Email or password was not recognized.',401);
  try{await claimAffiliateAttribution(db,cookies,auth.user.id)}catch(e){console.warn('Optional affiliate attribution skipped',e)}
  return new Response(null,{status:303,headers:{Location:next,'Set-Cookie':auth.cookie,'Cache-Control':'no-store'}});
 }catch(e){console.error('Unexpected sign-in error',e);return err('Sign-in encountered a server error. Please contact the site administrator.',503)}
};