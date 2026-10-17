import guides from '../../../data/guides.json';
import { dbFrom } from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { hasEntitlement } from '../../../lib/entitlements.js';
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function GET({params,request,locals}){
 const guide=guides.find(g=>g.slug===params.slug);
 if(!guide)return response({error:'Guide not found'},404);
 try{
  const db=dbFrom(locals);
  if(!db)return response({unlocked:false});
  const user=await getCurrentUser(db,request,locals);
  if(!user)return response({unlocked:false});
  const unlocked=await hasEntitlement(db,user.id,'business_builder_library');
  if(!unlocked)return response({unlocked:false});
  return response({unlocked:true,content:guide.content,choices:guide.choices||[]});
 }catch(e){console.error('guide entitlement lookup',e);return response({unlocked:false});}
}