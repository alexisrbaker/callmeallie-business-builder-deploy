const shapes=['oneoff','consumable','subscription','service'];
const label={oneoff:'One-Off',consumable:'Consumable',subscription:'Subscription',service:'Service'};
const add=(s,k,n=1)=>s[k]=(s[k]||0)+n;
export function scoreQuiz(a){
 const s=Object.fromEntries(shapes.map(x=>[x,0])), reasons=[], tradeoffs=[], unresolved=[];
 if(['A','B'].includes(a.q1)){add(s,'service',3);add(s,'oneoff',2);reasons.push('You want a comparatively fast path to something sellable.')}
 if(['A','B'].includes(a.q2)){add(s,'service',2);add(s,'oneoff',2);reasons.push('You prefer to limit upfront financial risk.')}
 if(['A','B'].includes(a.q5)){add(s,'oneoff',2);add(s,'subscription',2);tradeoffs.push('You want sales to scale without your workload increasing at the same rate.')}
 if(['C','D'].includes(a.q4)||a.q13==='C'){add(s,'service',5);reasons.push('You are comfortable being personally involved in the customer result.')}
 if(a.q11==='A'){add(s,'consumable',6);reasons.push('Repeat purchases because a product gets used up appeal to you.')}
 if(a.q11==='B'){add(s,'subscription',6);reasons.push('Continued payment for continued access or value appeals to you.')}
 if(a.q11==='C'){add(s,'service',6);reasons.push('Ongoing paid service relationships appeal to you.')}
 if(a.q11==='D'){add(s,'oneoff',5);reasons.push('You do not need repeat payment built into the original purchase.')}
 if(['A','B'].includes(a.q10)){add(s,'consumable',2);add(s,'subscription',2);add(s,'service',1)}
 if(a.q15==='D'){add(s,'oneoff',2);add(s,'subscription',3)}
 if(a.q16==='speed'){add(s,'service',4);add(s,'oneoff',2)}
 if(a.q16==='low_risk'){add(s,'service',3);add(s,'oneoff',2)}
 if(a.q16==='leverage'){add(s,'oneoff',4);add(s,'subscription',4)}
 if(a.q16==='repeat'){add(s,'consumable',4);add(s,'subscription',4);add(s,'service',2)}
 if(a.q16==='people')add(s,'service',5);
 const ranked=shapes.sort((x,y)=>s[y]-s[x]), primary=ranked[0], gap=s[primary]-s[ranked[1]];
 let implementation='The ownership/implementation path is still open.';
 if(a.q6==='A'||a.q9==='B')implementation='Start by exploring ways to sell or recommend something that already exists.';
 else if(a.q6==='B'||a.q9==='C')implementation='Explore creating your own version of an existing product category.';
 else if(a.q6==='C')implementation='Explore creating an offer from your own knowledge, skills, or creativity.';
 else if(a.q6==='D')implementation='Explore a genuinely new product idea, while expecting a longer validation and development path.';
 else unresolved.push('You have not decided whether you want to own the thing being sold or work with something that already exists.');
 if(a.q7==='E')unresolved.push('You are still open on physical versus digital.');
 if(a.q12==='E')unresolved.push('You are not yet sure which existing skills or knowledge could become part of the offer.');
 if(a.q10==='E'||a.q11==='E')unresolved.push('Your preference for one-off versus repeat customer revenue still needs exploration.');
 const guideMap={oneoff:[3],consumable:[20],subscription:[31],service:[39]};
 const result={shape:label[primary],shapeKey:primary,secondary:ranked.slice(1,3).map(x=>label[x]),implementation,confidence:gap>=4?'High':gap>=2?'Moderate':'Low',reasons:reasons.slice(0,5),tradeoffs,unresolved,recommendedGuides:[1,2,...guideMap[primary]]};
 if(result.confidence==='Low'){
   if(a.q6==='C'){result.fallback=[6,7];result.fallbackText='Because you want to create from your own knowledge or creativity, a low-cost digital one-off is a useful comparison point.'}
   else if(a.q6==='A'&&a.q7!=='B'){result.fallback=[8,9];result.fallbackText='Because you prefer something that already exists and are not committed to physical inventory, existing digital products are a useful comparison point.'}
   else if(['A','B'].includes(a.q12)&&['C','D'].includes(a.q4)){result.fallback=[40,41];result.fallbackText='Because you can start from existing skills and are comfortable helping customers directly, a service is a useful low-cost comparison point.'}
   else {result.fallback=[1];result.fallbackText='Your answers are genuinely mixed. Use Guide 1 to identify the constraint that should make the next decision for you.'}
 }
 return result;
}