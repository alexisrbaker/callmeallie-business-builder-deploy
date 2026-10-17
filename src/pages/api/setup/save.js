import { dbFrom,setSetting } from '../../../lib/db.js';
import { setupReadiness } from '../../../lib/setup-readiness.js';
import { registerUser,loginUser,hasSharedIdentity } from '../../../lib/auth.js';
export const POST=async({request,locals})=>{
 const check=await setupReadiness(locals);
 if(!check.ready)return new Response(check.message+' Missing: '+check.missing.join(', '),{status:503});
 const db=dbFrom(locals);
 try{
  const exists=await db.prepare('SELECT id FROM users WHERE is_owner=1 LIMIT 1').first();
  if(exists)return Response.redirect(new URL('/login',request.url),303);
  const f=await request.formData(),email=String(f.get('email')||'').trim().toLowerCase(),password=String(f.get('password')||''),name=String(f.get('name')||'').trim(),business=String(f.get('business_name')||'').trim();
  if(!email||password.length<10||!business)return new Response('Business name, owner email and a password of at least 10 characters are required.',{status:400});
  let auth;
  if(hasSharedIdentity(locals)){
   auth=await loginUser(db,request,locals,email,password);
   if(!auth || !['owner','admin'].includes(auth.user.role))return new Response('Sign in with your existing Publishing owner/admin account.',{status:401});
   await db.prepare('UPDATE users SET is_owner=1 WHERE id=?').bind(auth.user.id).run();
  }else{
   auth=await registerUser(db,request,locals,email,name,password,{owner:true});
  }
  await setSetting(db,'business_name',business);
  await setSetting(db,'setup_complete','1');
  return new Response(null,{status:303,headers:{Location:'/admin/settings','Set-Cookie':auth.cookie}});
 }catch(e){
  console.error('owner setup failed',e);
  return new Response('Owner setup could not complete. Check the website database migrations and shared identity binding.',{status:503});
 }
};
