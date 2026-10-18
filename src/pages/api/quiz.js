import { evaluateQuiz } from '../../lib/quiz-engine.js';
import { priorityCandidates } from '../../lib/priority.js';
import { dbFrom } from '../../lib/db.js';
import { getCurrentUser, randomId } from '../../lib/auth.js';
export const POST=async({request,locals})=>{
 let result,answers={},questionnaireVersion='2.1';
 try{
  const form=await request.formData();
  questionnaireVersion=String(form.get('questionnaire_version')||'2.1');
  for(let i=1;i<=16;i++)answers['q'+i]=String(form.get('q'+i)||'');
  if(!priorityCandidates(answers).some(x=>x.id===answers.q16))
   return new Response('Please select the final priority to see your results.',{status:400});
  result=evaluateQuiz(answers);
 }catch(e){console.error('Quiz evaluation error',e);return new Response('We could not calculate this result. Please try again.',{status:422})}
 // Quiz results are free: don't require an account or working D1 to show them.
 // Only signed-in users receive automatic result persistence.
 const db=dbFrom(locals);let resultId='';
 if(db){
  try{
   const user=await getCurrentUser(db,request,locals);
   if(user){
    const attempt=randomId(),rid=randomId();
    await db.prepare('INSERT INTO quiz_attempts(id,user_id,questionnaire_version,engine_version,completed_at,is_current) VALUES(?,?,?,?,CURRENT_TIMESTAMP,1)').bind(attempt,user.id,questionnaireVersion,'0.3').run();
    await db.prepare('UPDATE quiz_attempts SET is_current=0 WHERE user_id=? AND id<>?').bind(user.id,attempt).run();
    for(let i=1;i<=16;i++)await db.prepare('INSERT INTO quiz_answers(attempt_id,question_id,answer_id) VALUES(?,?,?)').bind(attempt,'q'+i,answers['q'+i]).run();
    await db.prepare('INSERT INTO quiz_results(id,attempt_id,business_shape,implementation_direction,confidence,explanation,tradeoffs,unresolved_questions) VALUES(?,?,?,?,?,?,?,?)').bind(rid,attempt,result.shape,result.implementation,result.confidence,JSON.stringify(result.reasons||[]),JSON.stringify(result.tradeoffs||[]),JSON.stringify(result.unresolved||[])).run();
    resultId=rid;
   }
  }catch(e){console.error('Optional quiz persistence failed; showing free results anyway',e)}
 }
 try{
  const url=new URL('/results',request.url);
  url.searchParams.set('r',encodeURIComponent(JSON.stringify(result)));
  if(resultId)url.searchParams.set('id',resultId);
  return Response.redirect(url,303);
 }catch(e){console.error('Quiz result redirect failed',e);return new Response('Results are temporarily unavailable. Please try again.',{status:503})}
};