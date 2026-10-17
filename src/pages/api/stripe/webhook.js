import { dbFrom } from '../../../lib/db.js';
import { verifyStripeSignature } from '../../../lib/stripe.js';
import { fulfillPaidOrder } from '../../../lib/mrr.js';
import { recordReversal } from '../../../lib/affiliate-connect.js';
import { createLicenseFromCheckout,syncLicenseFromSubscription } from '../../../lib/license-billing.js';
export async function POST({request,locals}){
  const env=locals?.runtime?.env||{},db=dbFrom(locals);const raw=await request.text();
  if(!await verifyStripeSignature(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return new Response('Invalid signature',{status:400});
  const event=JSON.parse(raw),o=event.data.object;
  if(event.type==='checkout.session.completed'){
    const m=o.metadata||{};
    if(m.purpose==='license_activation')await createLicenseFromCheckout(db,o);
    else if(m.user_id&&m.product_id&&o.payment_status==='paid')await fulfillPaidOrder(db,{checkoutSessionId:o.id,paymentId:o.payment_intent,userId:m.user_id,productId:m.product_id,amountCents:o.amount_total,currency:o.currency,sellerUserId:m.originating_seller_user_id||null,affiliateId:m.affiliate_id||null,affiliateCommissionCents:Number(m.affiliate_commission_cents||0)});
  }
  if(event.type==='charge.refunded'&&o.payment_intent){await recordReversal(db,o.payment_intent,o.amount_refunded,o.amount);if(o.amount_refunded>=o.amount)await db.prepare(`UPDATE orders SET status='refunded' WHERE provider_payment_id=? AND status='paid'`).bind(o.payment_intent).run();}
  if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted')await syncLicenseFromSubscription(db,o);
  return new Response('ok');
}
