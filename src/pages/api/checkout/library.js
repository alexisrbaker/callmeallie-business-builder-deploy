import {dbFrom} from '../../../lib/db.js';import {attributedAffiliate,claimAffiliateAttribution} from '../../../lib/affiliate-attribution.js';import {getCurrentUser} from '../../../lib/auth.js';import {eligibleSplit} from '../../../lib/affiliate-connect.js';import {createCheckoutSession} from '../../../lib/stripe.js';
export async function POST({request,locals,redirect,cookies}){
 const db=dbFrom(locals),user=await getCurrentUser(db,request,locals);if(!user)return redirect('/login?next=/buy',303);
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response('Invalid origin',{status:403});
 const fd=await request.formData();await claimAffiliateAttribution(db,cookies,user.id);const attribution=await attributedAffiliate(db,cookies,user.id);const aff=attribution?.public_code||String(fd.get('aff')||'');const product=await db.prepare(`SELECT id,name,price_cents,currency FROM products WHERE id='product_business_builder' AND status='active' LIMIT 1`).first();if(!product)return new Response('Unavailable',{status:409});
 const split=await eligibleSplit(db,aff,product.id,user.id,product.price_cents);const origin=new URL(request.url).origin;
 try{const s=await createCheckoutSession(locals?.runtime?.env?.STRIPE_SECRET_KEY,{productName:product.name,amountCents:product.price_cents,currency:product.currency,successUrl:`${origin}/library?purchase=success`,cancelUrl:`${origin}/buy${aff?'?aff='+encodeURIComponent(aff):''}`,userId:user.id,productId:product.id,affiliateSplit:split});return redirect(s.url,303);}catch(e){return new Response(e.message,{status:502});}
}
