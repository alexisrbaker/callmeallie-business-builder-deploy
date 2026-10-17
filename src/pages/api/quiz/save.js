import { dbFrom } from '../../../lib/db.js';
import { getCurrentUser, randomId } from '../../../lib/auth.js';
export const POST=async({request,locals})=>{
 const db=dbFrom(locals);
 if(!db)return new Response(JSON.stringify({error:'Database unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});
 const user=await getCurrentUser(db,request,locals);
 if(!user)return new Response(JSON.stringify({error:'Sign in to save results'}),{status:401,headers:{'Content-Type':'application/json'}});
 let result;try{result=await request.json()}catch{return new Response('Invalid result',{status:400})}
 if(!result||typeof result.shape!=='string'||typeof result.implementation!=='string'||!['string','undefined'].includes(typeof result.confidence))return new Response('Invalid result',{status:400});
 const attempt=randomId(),rid=randomId();
 try{
  await db.prepare(`INSERT INTO quiz_attempts(id,user_id,questionnaire_version,engine_version,completed_at,is_current) VALUES(?,?,?,?,CURRENT_TIMESTAMP,1)`).bind(attempt,user.id,'2.1','0.3').run();
  await db.prepare(`UPDATE quiz_attempts SET is_current=0 WHERE user_id=? AND id<>?`).bind(user.id,attempt).run();
  await db.prepare(`INSERT INTO quiz_results(id,attempt_id,business_shape,implementation_direction,confidence,explanation,tradeoffs,unresolved_questions) VALUES(?,?,?,?,?,?,?,?)`).bind(rid,attempt,result.shape.slice(0,250),result.implementation.slice(0,500),String(result.confidence||'').slice(0,50),JSON.stringify(result.reasons||[]),JSON.stringify(result.tradeoffs||[]),JSON.stringify(result.unresolved||[])).run();
  return new Response(JSON.stringify({saved:true}),{headers:{'Content-Type':'application/json'}});
 }catch(e){console.error('save quiz result',e);return new Response(JSON.stringify({error:'Could not save results. Check database migrations.'}),{status:503,headers:{'Content-Type':'application/json'}})}
};
