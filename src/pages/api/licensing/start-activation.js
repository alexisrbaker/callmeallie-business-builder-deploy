import { dbFrom,getSetting } from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { hasPaidMrrPackage } from '../../../lib/mrr.js';
import { createSubscriptionCheckoutSession } from '../../../lib/stripe.js';
export async function POST({request,locals,url}){
  const db=dbFrom(locals),env=locals?.runtime?.env||{};
  const user=await getCurrentUser(db,request,locals);if(!user)return new Response('Login required',{status:401});
  if(!await hasPaidMrrPackage(db,user.id))return new Response('MRR package purchase required',{status:403});
  const existing=await db.prepare(`SELECT l.id,l.status FROM licenses l JOIN license_types t ON t.id=l.license_type_id WHERE l.owner_user_id=? AND t.key='content_mrr' AND l.status IN ('active','payment_issue') ORDER BY l.created_at DESC LIMIT 1`).bind(user.id).first();
  if(existing)return Response.redirect(new URL('/account?license=existing',url),303);
  const fd=await request.formData();if(fd.get('accept')!=='yes')return new Response('License terms must be accepted',{status:400});
  const termsId=String(fd.get('terms_id')||'');
  const terms=await db.prepare(`SELECT lt.id FROM license_terms lt JOIN license_types t ON t.id=lt.license_type_id WHERE lt.id=? AND t.key='content_mrr' AND lt.status='active' AND lt.effective_at<=CURRENT_TIMESTAMP LIMIT 1`).bind(termsId).first();
  if(!terms)return new Response('Those terms are not currently active. Reload the activation page.',{status:409});
  const purchase=await db.prepare(`SELECT originating_seller_user_id FROM mrr_package_purchases WHERE buyer_user_id=? AND status='paid' ORDER BY created_at DESC LIMIT 1`).bind(user.id).first();
  const priceId=await getSetting(db,'content_mrr_stripe_price_id');
  if(!priceId)return new Response('Commercial-license billing has not been configured yet.',{status:503});
  const base=`${url.protocol}//${url.host}`;
  const session=await createSubscriptionCheckoutSession(env.STRIPE_SECRET_KEY,{priceId,successUrl:`${base}/mrr/activation-success`,cancelUrl:`${base}/mrr/activate`,userId:user.id,licenseTypeKey:'content_mrr',termsId,sellerUserId:purchase?.originating_seller_user_id||null});
  return Response.redirect(session.url,303);
}
