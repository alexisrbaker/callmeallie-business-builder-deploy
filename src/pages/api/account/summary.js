import { dbFrom } from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export const GET=async({request,locals})=>{
 const db=dbFrom(locals);
 if(!db)return json({authenticated:false,unavailable:true,message:'Account database is not connected.'},503);
 let user;
 try{user=await getCurrentUser(db,request,locals)}
 catch(e){console.error('account authentication',e);return json({authenticated:false,unavailable:true,message:'Sign-in is temporarily unavailable.'},503)}
 if(!user)return json({authenticated:false});
 const result={authenticated:true,name:user.display_name||user.email||'there',email:user.email||'',isOwner:Boolean(user.is_owner),attempts:[],entitlements:[],licenses:[],warnings:[]};
 try{result.attempts=(await db.prepare('SELECT qa.completed_at,qa.is_current,qr.business_shape,qr.implementation_direction,qr.confidence FROM quiz_attempts qa LEFT JOIN quiz_results qr ON qr.attempt_id=qa.id WHERE qa.user_id=? ORDER BY qa.completed_at DESC LIMIT 20').bind(user.id).all()).results||[]}
 catch(e){console.error('account quiz history',e);result.warnings.push('Saved quiz history is temporarily unavailable.')}
 try{result.entitlements=(await db.prepare('SELECT entitlement_key,status,ends_at FROM entitlements WHERE user_id=? ORDER BY created_at DESC').bind(user.id).all()).results||[]}
 catch(e){console.error('account entitlements',e);result.warnings.push('Purchase access information is temporarily unavailable.')}
 try{result.licenses=(await db.prepare('SELECT l.status,l.billing_status,l.current_period_end,lt.name FROM licenses l JOIN license_types lt ON lt.id=l.license_type_id WHERE l.owner_user_id=? ORDER BY l.created_at DESC').bind(user.id).all()).results||[]}
 catch(e){console.error('account licenses',e);result.warnings.push('License information is temporarily unavailable.')}
 return json(result);
};