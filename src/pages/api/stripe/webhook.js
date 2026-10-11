import{dbFrom}from'../../../lib/db.js';import{fulfillPaidOrder}from'../../../lib/mrr.js';import{createLicenseFromCheckout,syncLicenseFromSubscription}from'../../../lib/license-billing.js';
export const POST=async({request,locals})=>{const db=dbFrom(locals);if(!db)return new Response('Database unavailable',{status:503});let event;try{event=await request.json()}catch{return new Response('Invalid payload',{status:400})}
try{
 if(event.type==='checkout.session.completed'){const s=event.data?.object||{},m=s.metadata||{};if(m.purpose==='license_activation')await createLicenseFromCheckout(db,s);else if(m.user_id&&m.product_id)await fulfillPaidOrder(db,{checkoutSessionId:s.id,paymentId:s.payment_intent,userId:m.user_id,productId:m.product_id,amountCents:s.amount_total||0,currency:s.currency||'usd',sellerUserId:m.seller_user_id||null,affiliateId:m.affiliate_id||null,affiliateCommissionCents:Number(m.affiliate_commission_cents||0)});}
 if(event.type?.startsWith('customer.subscription.'))await syncLicenseFromSubscription(db,event.data?.object);
 return new Response('ok');
}catch(e){return new Response('Webhook processing failed',{status:500})}};