import {dbFrom} from '../../../lib/db.js';
import {logoutUser} from '../../../lib/auth.js';
export const POST=async({request,locals})=>{
 try{
  const cookies=await logoutUser(dbFrom(locals),request,locals);
  const headers=new Headers({Location:'/'});
  for(const cookie of (Array.isArray(cookies)?cookies:[cookies]))headers.append('Set-Cookie',cookie);
  return new Response(null,{status:303,headers});
 }catch(e){
  console.error('Sign out failed',e);
  return new Response('Could not sign out. Please try again.',{status:503});
 }
};