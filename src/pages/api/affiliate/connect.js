import {dbFrom} from '../../../lib/db.js';
import {getCurrentUser} from '../../../lib/auth.js';
import {ensureAffiliate,getAffiliate} from '../../../lib/affiliate-connect.js';
import {stripeRequest} from '../../../lib/stripe.js';
export async function POST({request,locals,redirect}){
 const db=dbFrom(locals),user=await getCurrentUser(db,request,locals);if(!user)return redirect('/login?next=/affiliate',303);
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response('Invalid origin',{status:403});
 const secret=locals?.runtime?.env?.STRIPE_SECRET_KEY;if(!secret)return new Response('Stripe is not configured',{status:503});
 let a=await getAffiliate(db,user.id);if(!a)return new Response('Affiliate enrollment is required',{status:403});
 try{
  if(!a.stripe_account_id){const acct=await stripeRequest(secret,'accounts',{'type':'express','country':'US','capabilities[transfers][requested]':'true','metadata[affiliate_user_id]':user.id});await db.prepare(`UPDATE affiliates SET stripe_account_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND stripe_account_id IS NULL`).bind(acct.id,a.id).run();a=await getAffiliate(db,user.id);}
  const base=new URL(request.url).origin;
  const link=await stripeRequest(secret,'account_links',{account:a.stripe_account_id,refresh_url:`${base}/affiliate?connect=refresh`,return_url:`${base}/affiliate?connect=return`,type:'account_onboarding'});
  return redirect(link.url,303);
 }catch(e){return new Response('Stripe onboarding could not start: '+e.message,{status:502});}
}
