import { evaluateQuiz } from '../../lib/quiz-engine.js';
import { priorityCandidates } from '../../lib/priority.js';
import { dbFrom } from '../../lib/db.js';
import { getCurrentUser, randomId } from '../../lib/auth.js';
export const POST=async({request,locals})=>{
  const f=await request.formData(), answers={}; for(let i=1;i<=16;i++) answers[`q${i}`]=String(f.get(`q${i}`)||'');
  const valid=priorityCandidates(answers).some(x=>x.id===answers.q16); if(!valid) return new Response('Please choose the final priority that best reflects your answers.',{status:400});
  const result=evaluateQuiz(answers), db=dbFrom(locals); let resultId='';
  if(db){try{const user=await getCurrentUser(db,request,locals), attempt=randomId(), rid=randomId();resultId=rid;await db.prepare(`INSERT INTO quiz_attempts(id,user_id,questionnaire_version,engine_version,completed_at,is_current) VALUES(?,?,?,?,CURRENT_TIMESTAMP,1)`).bind(attempt,user?.id||null,String(f.get('questionnaire_version')||'2.1'),'0.3').run();if(user)await db.prepare(`UPDATE quiz_attempts SET is_current=0 WHERE user_id=? AND id<>?`).bind(user.id,attempt).run();for(let i=1;i<=16;i++)await db.prepare(`INSERT INTO quiz_answers(attempt_id,question_id,answer_id) VALUES(?,?,?)`).bind(attempt,`q${i}`,answers[`q${i}`]).run();await db.prepare(`INSERT INTO quiz_results(id,attempt_id,business_shape,implementation_direction,confidence,explanation,tradeoffs,unresolved_questions) VALUES(?,?,?,?,?,?,?,?)`).bind(rid,attempt,result.shape,result.implementation,result.confidence,JSON.stringify(result.reasons||[]),JSON.stringify(result.tradeoffs||[]),JSON.stringify(result.unresolved||[])).run();}catch(e){console.error('quiz persistence',e)}}
  const u=new URL('/results',request.url);u.searchParams.set('r',encodeURIComponent(JSON.stringify(result)));if(resultId)u.searchParams.set('id',resultId);return Response.redirect(u,303);
};