import { randomId } from './auth.js';

export function localLicenseStatus(stripeStatus){
  if(stripeStatus==='active'||stripeStatus==='trialing')return 'active';
  if(stripeStatus==='past_due'||stripeStatus==='unpaid'||stripeStatus==='incomplete'||stripeStatus==='paused')return 'payment_issue';
  return 'inactive';
}
function isoFromUnix(v){return v?new Date(Number(v)*1000).toISOString():null;}
function periodEnd(subscription){
  return subscription?.current_period_end || subscription?.items?.data?.[0]?.current_period_end || null;
}
export async function createLicenseFromCheckout(db,session){
  const m=session.metadata||{};
  if(m.purpose!=='license_activation'||!m.user_id||!m.terms_id||!session.subscription)return null;
  const type=await db.prepare(`SELECT id FROM license_types WHERE key=? AND status='active' LIMIT 1`).bind(m.license_type_key||'content_mrr').first();
  if(!type)return null;
  const terms=await db.prepare(`SELECT id FROM license_terms WHERE id=? AND license_type_id=? AND status='active' AND effective_at<=CURRENT_TIMESTAMP LIMIT 1`).bind(m.terms_id,type.id).first();
  if(!terms)return null;
  let license=await db.prepare(`SELECT id FROM licenses WHERE billing_provider='stripe' AND billing_subscription_id=? LIMIT 1`).bind(session.subscription).first();
  if(!license){
    const id=randomId();
    await db.prepare(`INSERT INTO licenses(id,license_type_id,owner_user_id,originating_seller_user_id,status,starts_at,billing_provider,billing_subscription_id,billing_customer_id,billing_status,accepted_terms_id,updated_at) VALUES(?,?,?,?, 'active',CURRENT_TIMESTAMP,'stripe',?,?,?,?,CURRENT_TIMESTAMP)`).bind(id,type.id,m.user_id,m.originating_seller_user_id||null,session.subscription,session.customer||null,'active',terms.id).run();
    await db.prepare(`INSERT INTO license_acceptances(id,license_id,terms_id,user_id) VALUES(?,?,?,?)`).bind(randomId(),id,terms.id,m.user_id).run();
    license={id};
  }
  return license.id;
}
export async function syncLicenseFromSubscription(db,sub){
  if(!sub?.id)return false;
  const status=localLicenseStatus(sub.status);
  const end=isoFromUnix(periodEnd(sub));
  const canceled=isoFromUnix(sub.canceled_at);
  const r=await db.prepare(`UPDATE licenses SET status=?,billing_status=?,billing_customer_id=COALESCE(?,billing_customer_id),current_period_end=?,ends_at=CASE WHEN ?='inactive' THEN COALESCE(?,ends_at) ELSE ends_at END,canceled_at=COALESCE(?,canceled_at),updated_at=CURRENT_TIMESTAMP WHERE billing_provider='stripe' AND billing_subscription_id=?`).bind(status,sub.status||null,sub.customer||null,end,status,end,canceled,sub.id).run();
  return Boolean(r?.meta?.changes);
}
