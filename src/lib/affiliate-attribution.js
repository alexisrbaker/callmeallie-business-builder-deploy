import { randomId } from './auth.js';
import { findAffiliate, safeRef } from './affiliate-connect.js';

export const ATTR_COOKIE='allie_aff_v1';
const DAYS=30;

function cookieOptions(){return {httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:DAYS*86400};}
export function visitorToken(cookies){return String(cookies?.get(ATTR_COOKIE)?.value||'');}

// First-touch attribution: a later affiliate URL does not replace an unexpired attribution.
export async function captureAffiliateAttribution(db,cookies,ref){
  if(!db||!cookies||!safeRef(ref))return null;
  const existing=visitorToken(cookies);
  if(existing){
    const row=await db.prepare(`SELECT aa.*,a.public_code FROM affiliate_attributions aa JOIN affiliates a ON a.id=aa.affiliate_id WHERE aa.visitor_token=? AND aa.expires_at>CURRENT_TIMESTAMP LIMIT 1`).bind(existing).first();
    if(row){await db.prepare(`UPDATE affiliate_attributions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?`).bind(row.id).run();return row;}
  }
  const affiliate=await findAffiliate(db,ref);if(!affiliate)return null;
  const token=randomId(24),id=randomId();
  await db.prepare(`INSERT INTO affiliate_attributions(id,affiliate_id,visitor_token,created_at,expires_at,last_seen_at) VALUES(?,?,?,CURRENT_TIMESTAMP,datetime('now','+${DAYS} days'),CURRENT_TIMESTAMP)`).bind(id,affiliate.id,token).run();
  cookies.set(ATTR_COOKIE,token,cookieOptions());
  return {id,affiliate_id:affiliate.id,visitor_token:token,public_code:affiliate.public_code};
}

export async function claimAffiliateAttribution(db,cookies,userId){
  const token=visitorToken(cookies);if(!db||!token||!userId)return null;
  // Do not replace an existing unexpired user attribution. This preserves first touch across devices once claimed.
  const existing=await db.prepare(`SELECT * FROM affiliate_attributions WHERE user_id=? AND expires_at>CURRENT_TIMESTAMP ORDER BY created_at ASC LIMIT 1`).bind(userId).first();
  if(existing)return existing;
  const row=await db.prepare(`SELECT * FROM affiliate_attributions WHERE visitor_token=? AND expires_at>CURRENT_TIMESTAMP LIMIT 1`).bind(token).first();
  if(!row)return null;
  await db.prepare(`UPDATE affiliate_attributions SET user_id=?,claimed_at=COALESCE(claimed_at,CURRENT_TIMESTAMP),last_seen_at=CURRENT_TIMESTAMP WHERE id=? AND user_id IS NULL`).bind(userId,row.id).run();
  return db.prepare(`SELECT * FROM affiliate_attributions WHERE id=?`).bind(row.id).first();
}

export async function attributedAffiliate(db,cookies,userId){
  if(!db)return null;
  let row=null;
  if(userId)row=await db.prepare(`SELECT aa.*,a.public_code FROM affiliate_attributions aa JOIN affiliates a ON a.id=aa.affiliate_id WHERE aa.user_id=? AND aa.expires_at>CURRENT_TIMESTAMP AND a.status='active' ORDER BY aa.created_at ASC LIMIT 1`).bind(userId).first();
  if(!row){const token=visitorToken(cookies);if(token)row=await db.prepare(`SELECT aa.*,a.public_code FROM affiliate_attributions aa JOIN affiliates a ON a.id=aa.affiliate_id WHERE aa.visitor_token=? AND aa.expires_at>CURRENT_TIMESTAMP AND a.status='active' LIMIT 1`).bind(token).first();}
  return row||null;
}
