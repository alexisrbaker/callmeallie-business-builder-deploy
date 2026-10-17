function form(data){const p=new URLSearchParams();for(const [k,v] of Object.entries(data)){if(v!==undefined&&v!==null&&v!=='')p.append(k,String(v));}return p;}
export async function stripeRequest(secret,path,data){if(!secret)throw new Error('Stripe is not connected.');const r=await fetch(`https://api.stripe.com/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded'},body:form(data)});const j=await r.json();if(!r.ok)throw new Error(j?.error?.message||'Stripe request failed.');return j;}
export async function createCheckoutSession(secret,{productName,amountCents,currency='usd',successUrl,cancelUrl,userId,productId,sellerUserId,affiliateSplit}){return stripeRequest(secret,'checkout/sessions',{
  mode:'payment',
  success_url:successUrl,
  cancel_url:cancelUrl,
  'line_items[0][price_data][currency]':currency,
  'line_items[0][price_data][unit_amount]':amountCents,
  'line_items[0][price_data][product_data][name]':productName,
  'line_items[0][quantity]':1,
  'payment_intent_data[application_fee_amount]':affiliateSplit?.commissionCents ? amountCents-affiliateSplit.commissionCents : undefined,
  'payment_intent_data[transfer_data][destination]':affiliateSplit?.connectedAccount,
  'metadata[affiliate_id]':affiliateSplit?.affiliateId||'',
  'metadata[affiliate_commission_cents]':affiliateSplit?.commissionCents||'',
  'metadata[user_id]':userId,
  'metadata[product_id]':productId,
  'metadata[originating_seller_user_id]':sellerUserId||'',
  'payment_intent_data[metadata][affiliate_id]':affiliateSplit?.affiliateId||'',
  'payment_intent_data[metadata][affiliate_commission_cents]':affiliateSplit?.commissionCents||'',
  'payment_intent_data[metadata][user_id]':userId,
  'payment_intent_data[metadata][product_id]':productId,
  'payment_intent_data[metadata][originating_seller_user_id]':sellerUserId||''
});}
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function verifyStripeSignature(rawBody,header,secret,tolerance=300){
 if(!header||!secret)return false;
 const fields=header.split(',').map(p=>p.trim().split('=',2));
 const t=Number(fields.find(p=>p[0]==='t')?.[1]);const sigs=fields.filter(p=>p[0]==='v1').map(p=>p[1]);
 if(!Number.isFinite(t)||!sigs.length||Math.abs(Date.now()/1000-t)>tolerance)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${t}.${rawBody}`));const expected=hex(digest);
 return sigs.some(sig=>{if(!/^[0-9a-f]{64}$/i.test(sig))return false;let diff=0;for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^sig.toLowerCase().charCodeAt(i);return diff===0});
}

export async function createSubscriptionCheckoutSession(secret,{priceId,successUrl,cancelUrl,userId,licenseTypeKey,termsId,sellerUserId}){
  if(!priceId)throw new Error('The recurring license Stripe Price ID is not configured.');
  return stripeRequest(secret,'checkout/sessions',{
    mode:'subscription',
    success_url:successUrl,
    cancel_url:cancelUrl,
    'line_items[0][price]':priceId,
    'line_items[0][quantity]':1,
    'metadata[purpose]':'license_activation',
    'metadata[user_id]':userId,
    'metadata[license_type_key]':licenseTypeKey,
    'metadata[terms_id]':termsId,
    'metadata[originating_seller_user_id]':sellerUserId||'',
    'subscription_data[metadata][purpose]':'license_activation',
    'subscription_data[metadata][user_id]':userId,
    'subscription_data[metadata][license_type_key]':licenseTypeKey,
    'subscription_data[metadata][terms_id]':termsId,
    'subscription_data[metadata][originating_seller_user_id]':sellerUserId||''
  });
}

export async function stripeGet(secret,path){const r=await fetch(`https://api.stripe.com/v1/${path}`,{headers:{Authorization:`Bearer ${secret}`}});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'Stripe request failed');return j;}
