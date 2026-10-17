import { PRIORITIES } from './priority.js';
const add=(scores,key,n=1)=>{scores[key]=(scores[key]||0)+n};
const unknown=(v)=>v==='E';

export function evaluateQuiz(a){
  const s={oneoff:0,consumable:0,subscription:0,service:0,owned:0,existing:0,ownVersion:0,invention:0,digital:0,physical:0,scalable:0};
  const reasons=[]; const tradeoffs=[]; const unresolved=[];

  // Q11 is the strongest economic-shape signal.
  if(a.q11==='A'){add(s,'consumable',6); reasons.push('You prefer repeat purchases driven by replenishment, which points strongly toward consumables.');}
  if(a.q11==='B'){add(s,'subscription',6); reasons.push('You prefer customers to keep paying for continuing access or value, which points strongly toward subscriptions.');}
  if(a.q11==='C'){add(s,'service',6); reasons.push('You prefer repeat revenue from continuing to do work for customers, which points strongly toward recurring services.');}
  if(a.q11==='D'){add(s,'oneoff',5); reasons.push('You do not need repeat purchasing built into the model, so one-off offers remain a strong fit.');}
  if(unknown(a.q11)) unresolved.push('What, if anything, should cause the same customer to pay again?');

  // Workload/customer contact.
  if(a.q4==='C'||a.q4==='D'){add(s,'service',2); reasons.push('You are comfortable with direct customer involvement.');}
  if(a.q4==='A'){add(s,'oneoff',1);add(s,'subscription',1);add(s,'scalable',1);}
  if(a.q5==='A'){add(s,'oneoff',2);add(s,'subscription',2);add(s,'scalable',3); reasons.push('You want additional sales to create very little additional work.');}
  if(a.q5==='C'||a.q5==='D'){add(s,'service',2);}
  if(unknown(a.q5)) unresolved.push('How much additional work are you willing to create with each additional customer?');

  // Creation/ownership.
  if(a.q6==='A'){add(s,'existing',5); reasons.push('You would rather begin with something that already exists than develop the product from scratch.');}
  if(a.q6==='B'){add(s,'ownVersion',5);add(s,'owned',2); reasons.push('You like the idea of owning your version of an established kind of product.');}
  if(a.q6==='C'){add(s,'owned',5); reasons.push('You want to create from your own knowledge, skills, or creativity.');}
  if(a.q6==='D'){add(s,'invention',6);add(s,'owned',3); reasons.push('You are open to developing something genuinely new.');}
  if(unknown(a.q6)) unresolved.push('Do you want to create, adapt, or begin by selling something that already exists?');
  if(a.q9==='A') add(s,'owned',3);
  if(a.q9==='B') add(s,'existing',3);
  if(a.q9==='C'){add(s,'ownVersion',4);add(s,'owned',1);}
  if(unknown(a.q9)) unresolved.push('How important is owning and controlling the product itself?');

  // Physical/digital preference and operations.
  if(a.q7==='A') add(s,'digital',4);
  if(a.q7==='B') add(s,'physical',4);
  if(a.q7==='C'){add(s,'digital',1);add(s,'physical',1);}
  if(a.q7==='D'){add(s,'digital',2);add(s,'physical',2);}
  if(a.q8==='A'){add(s,'digital',3); if(s.physical>0) tradeoffs.push('Physical products appeal to you more than physical inventory and fulfillment do. Outsourced fulfillment or non-inventory models may deserve extra attention.');}
  if(a.q8==='C'||a.q8==='D') add(s,'physical',3);
  if(unknown(a.q7)||unknown(a.q8)) unresolved.push('Would you rather work with digital products, physical products, or either?');

  // Speed/capital are constraints, not promises.
  if(a.q1==='A'){add(s,'service',3);add(s,'existing',3); tradeoffs.push('Speed matters to you, so development-heavy ideas should be treated cautiously even if they otherwise appeal to you.');}
  if(a.q1==='D'){add(s,'owned',2);add(s,'invention',1);}
  if(a.q2==='A'){add(s,'service',3);add(s,'digital',2);add(s,'existing',1); tradeoffs.push('You want very low financial exposure before proof, which makes inventory, tooling, and expensive development weaker starting points.');}
  if(a.q2==='D'){add(s,'owned',1);add(s,'ownVersion',1);add(s,'invention',1);}
  if(a.q3==='A'||a.q3==='E'){add(s,'scalable',2); if(s.service>2) tradeoffs.push('Your available time is limited or inconsistent, so a high-touch service would need careful capacity boundaries.');}
  if(a.q12==='A'||a.q12==='B') add(s,'service',2);
  if(a.q12==='D'){add(s,'owned',1);add(s,'invention',1);}
  if(a.q12==='E'){add(s,'service',1); unresolved.push('Which existing skills, knowledge, equipment, or experience could already be sellable?');}
  if(a.q13==='A') add(s,'owned',2);
  if(a.q13==='B') add(s,'existing',3);
  if(a.q13==='C') add(s,'service',3);
  if(a.q13==='D'){add(s,'owned',1);add(s,'physical',1);add(s,'subscription',1);}
  if(a.q14==='D') add(s,'scalable',2);
  if(a.q15==='A'){add(s,'service',2);add(s,'digital',1);}
  if(a.q15==='B'){add(s,'service',2);add(s,'existing',2);}
  if(a.q15==='C') add(s,'owned',3);
  if(a.q15==='D'){add(s,'scalable',3);add(s,'oneoff',1);add(s,'subscription',1);}
  if(unknown(a.q15)) unresolved.push('Which tradeoff matters most right now: financial risk, speed, ownership, or time leverage?');

  // Final personalized priority is deliberately strong. Two people can have the same constraints and preferences but make different tradeoffs.
  const priority=PRIORITIES[a.q16];
  if(priority){
    for(const [k,v] of Object.entries(priority.shape||{})) add(s,k,v);
    for(const [k,v] of Object.entries(priority.impl||{})) add(s,k,v);
    if(priority.digital) add(s,'digital',priority.digital);
    if(priority.physical) add(s,'physical',priority.physical);
    if(priority.scalable) add(s,'scalable',priority.scalable);
    reasons.unshift(`When your preferences conflict, your top priority is to ${priority.label.charAt(0).toLowerCase()+priority.label.slice(1)}.`);
  } else unresolved.push('Which of your competing priorities matters most when you cannot maximize all of them at once?');

  // Repeat-income preference nudges only; mechanism in Q11 decides shape.
  if(a.q10==='A'||a.q10==='B'){add(s,'consumable',1);add(s,'subscription',1);add(s,'service',1);}
  if(a.q10==='C') add(s,'oneoff',2);

  const shapes=['oneoff','consumable','subscription','service'].sort((x,y)=>s[y]-s[x]);
  const top=shapes[0], second=shapes[1], gap=s[top]-s[second];
  const answered=Object.entries(a).filter(([k,v])=>k!=='q16'&&v).length;
  const unsure=Object.values(a).filter(v=>v==='E').length;
  let confidence=(answered===15 && unsure<=3 && gap>=3)?'high':(answered>=13 && gap>=1?'medium':'low');

  const shapeNames={oneoff:'One-Off',consumable:'Consumable',subscription:'Subscription',service:'Service'};
  const startGuides={oneoff:[3,4],consumable:[20,21],subscription:[31,32],service:[39,40]};
  const secondary=shapes.slice(1,3).filter(k=>s[k]>=s[top]-3).map(k=>shapeNames[k]);

  let implementation='Keep the implementation open while you explore this path';
  const impl=[['existing',s.existing],['owned',s.owned],['ownVersion',s.ownVersion],['invention',s.invention]].sort((x,y)=>y[1]-x[1]);
  if(impl[0][1]>=4){implementation={existing:'Start by exploring products or offers that already exist',owned:'Explore something you create and own',ownVersion:'Explore your own version of an established product type',invention:'Explore a genuinely new product or invention'}[impl[0][0]];}

  let recommended=[...startGuides[top]];
  if(top==='oneoff'){
    if(s.digital>s.physical+1) recommended.push(5);
    else if(s.physical>s.digital+1) recommended.push(11);
    if(impl[0][0]==='existing') recommended.push(s.digital>=s.physical?8:16);
    if(impl[0][0]==='owned') recommended.push(s.digital>=s.physical?6:12);
  }
  if(top==='consumable') recommended.push(impl[0][0]==='existing'?26:22);
  if(top==='service') recommended.push(41,42);
  if(top==='subscription' && impl[0][0]==='existing') recommended=[31,37,38];
  recommended=[...new Set(recommended)];

  if(confidence==='low'){
    return {confidence,shape:'Uncertain / mixed',implementation:'Your answers do not support one narrow personal recommendation yet.',secondary:[],reasons:reasons.slice(0,3),tradeoffs,unresolved:[...new Set(unresolved)],recommendedGuides:[1,2],fallback:[6,8,40],fallbackText:'Because the signal is still mixed, the default exploration recommendation is to compare three relatively accessible starting points: create a digital product, sell an existing digital product, or sell a service using an existing skill. This is a default exploration route, not a personalized claim that these are your best matches.'};
  }
  return {confidence,shape:shapeNames[top],implementation,secondary,reasons:[...new Set(reasons)].slice(0,5),tradeoffs:[...new Set(tradeoffs)].slice(0,4),unresolved:[...new Set(unresolved)].slice(0,5),recommendedGuides:recommended};
}
