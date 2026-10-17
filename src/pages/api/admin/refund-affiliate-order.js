import {dbFrom} from '../../../lib/db.js';import {getCurrentUser} from '../../../lib/auth.js';import {stripeRequest} from '../../../lib/stripe.js';
export async function POST({request,locals}){
 const db=dbFrom(locals),user=await getCurrentUser(db,request,locals);if(!user?.is_owner)return new Response('Forbidden',{status:403});
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response('Invalid origin',{status:403});
 const fd=await request.formData(),orderId=String(fd.get('order_id')||'');
 const order=await db.prepare(`SELECT o.provider_payment_id,c.id AS commission_id FROM orders o LEFT JOIN commissions c ON c.order_id=o.id WHERE o.id=? AND o.status='paid' LIMIT 1`).bind(orderId).first();
 if(!order?.provider_payment_id)return new Response('Paid Stripe order not found',{status:404});
 try{
  const refund=await stripeRequest(locals?.runtime?.env?.STRIPE_SECRET_KEY,'refunds',{'payment_intent':order.provider_payment_id,'reverse_transfer':order.commission_id?'true':undefined,'refund_application_fee':order.commission_id?'true':undefined});
  return Response.json({refund_id:refund.id,status:refund.status,note:'Order and commission state will be reconciled by Stripe webhook.'});
 }catch(e){return new Response(e.message,{status:502});}
}
