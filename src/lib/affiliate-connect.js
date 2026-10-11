import { randomId } from './auth.js';
const PRODUCTS=new Set(['product_business_builder','product_business_builder_mrr']);
export function isAllowedAffiliateProduct(id){return PRODUCTS.has(id);}
export function affiliateCode(){return 'a'+randomId(7);}
export function safeRef(ref){return /^[a-zA-Z0-9_-]{2,80}$/.test(ref||'')?ref:'';}
export async function findAffiliate(db,ref){if(!safeRef(ref))return null;return db.prepare(`SELECT a.id,a.user_id,a.public_code,a.stripe_account_id,a.stripe_charges_enabled,a.status FROM affiliates a WHERE a.public_code=? AND a.status='active' LIMIT 1`).bind(ref).first();}
export async function eligibleSplit(db,ref,productId,buyerId,amountCents){
 if(!isAllowedAffiliateProduct(productId)||!Number.isSafeInteger(amountCents)||amountCents<=0)return null;
 const a=await findAffiliate(db,ref);
 if(!a||a.user_id===buyerId||!a.stripe_account_id||!a.stripe_charges_enabled)return null;
 const rule=await db.prepare(`SELECT percent_basis_points,fixed_cents FROM commission_rules WHERE product_id=? AND status='active' LIMIT 1`).bind(productId).first();
 if(!rule)return null;
 const cents=Math.floor(amountCents*rule.percent_basis_points/10000)+rule.fixed_cents;
 if(cents<=0||cents>=amountCents)return null;
 return {affiliateId:a.id,connectedAccount:a.stripe_account_id,commissionCents:cents};
}
export async function getAffiliate(db,userId){return db.prepare('SELECT * FROM affiliates WHERE user_id=? LIMIT 1').bind(userId).first();}
export async function ensureAffiliate(db,userId){let a=await getAffiliate(db,userId);if(a)return a;await db.prepare(`INSERT INTO affiliates(id,user_id,public_code,status) VALUES(?,?,?,'pending')`).bind(randomId(),userId,affiliateCode()).run();return getAffiliate(db,userId);}
export async function refreshAccount(db,secret,a){if(!a?.stripe_account_id)return a;const r=await fetch(`https://api.stripe.com/v1/accounts/${encodeURIComponent(a.stripe_account_id)}`,{headers:{Authorization:`Bearer ${secret}`}});const account=await r.json();if(!r.ok)throw new Error(account.error?.message||'Unable to read Stripe account');await db.prepare(`UPDATE affiliates SET stripe_charges_enabled=?,stripe_payouts_enabled=?,stripe_details_submitted=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(account.charges_enabled?1:0,account.payouts_enabled?1:0,account.details_submitted?1:0,a.id).run();return getAffiliate(db,a.user_id);}
export async function recordCommission(db,{orderId,affiliateId,amountCents,paymentIntentId}){
 if(!affiliateId||!Number.isInteger(amountCents)||amountCents<=0)return;
 await db.prepare(`INSERT OR IGNORE INTO commissions(id,affiliate_id,order_id,amount_cents,status,provider,provider_payment_intent_id) VALUES(?,?,?,?, 'transferred','stripe_connect',?)`).bind(randomId(),affiliateId,orderId,amountCents,paymentIntentId||null).run();
}
export async function recordReversal(db,paymentIntentId,refundedCents,originalTotalCents){
 if(!paymentIntentId||!originalTotalCents||!Number.isFinite(refundedCents))return;
 const c=await db.prepare(`SELECT id,amount_cents,reversed_cents FROM commissions WHERE provider_payment_intent_id=? LIMIT 1`).bind(paymentIntentId).first();if(!c)return;
 const target=Math.min(c.amount_cents,Math.floor(c.amount_cents*Math.min(originalTotalCents,refundedCents)/originalTotalCents));
 await db.prepare(`UPDATE commissions SET reversed_cents=?,status=? WHERE id=? AND reversed_cents<?`).bind(target,target>=c.amount_cents?'reversed':'partially_reversed',c.id,target).run();
}
