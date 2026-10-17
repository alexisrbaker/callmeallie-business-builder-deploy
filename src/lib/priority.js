export const PRIORITIES={
 speed:{label:'Get to something sellable and a realistic chance of first revenue sooner',shape:{service:5,oneoff:2},impl:{existing:5}},
 low_risk:{label:'Keep the amount of money I risk before proof as low as possible',shape:{service:4,oneoff:2},impl:{existing:3},digital:3},
 ownership:{label:'Own and control the product or offer, even if it takes longer',shape:{oneoff:2,subscription:1},impl:{owned:5,ownVersion:4,invention:2}},
 leverage:{label:'Keep each additional sale from requiring much more of my time',shape:{oneoff:4,subscription:4},scalable:5},
 repeat:{label:'Build repeat or recurring customer revenue into the model',shape:{consumable:3,subscription:3,service:2}},
 people:{label:'Work directly with customers and help them get a result',shape:{service:5}},
 physical:{label:'Work with a physical product rather than a purely digital offer',physical:5},
 digital:{label:'Keep the business primarily digital and avoid physical operations',digital:5}
};
export function priorityCandidates(a){const out=[];const add=k=>{if(!out.includes(k))out.push(k)};
 if(a.q1==='A'||a.q1==='B'||a.q15==='B')add('speed');
 if(a.q2==='A'||a.q2==='B'||a.q15==='A')add('low_risk');
 if(['B','C','D'].includes(a.q6)||['A','C'].includes(a.q9)||a.q15==='C')add('ownership');
 if(['A','B'].includes(a.q5)||a.q15==='D')add('leverage');
 if(['A','B'].includes(a.q10)||['A','B','C'].includes(a.q11))add('repeat');
 if(['C','D'].includes(a.q4)||a.q13==='C')add('people');
 if(a.q7==='B')add('physical'); if(a.q7==='A')add('digital');
 const defaults=['speed','low_risk','ownership','leverage'];for(const k of defaults) if(out.length<4)add(k);
 return out.slice(0,4).map(k=>({id:k,text:PRIORITIES[k].label}));}
