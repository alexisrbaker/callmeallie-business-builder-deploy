export function dbFrom(locals){ return locals?.runtime?.env?.DB || null; }
export function identityDbFrom(locals){ return locals?.runtime?.env?.IDENTITY_DB || null; }
export async function getSetting(db,key){ if(!db)return null; const r=await db.prepare('SELECT value FROM site_settings WHERE key=? LIMIT 1').bind(key).first(); return r?.value ?? null; }
export async function setSetting(db,key,value){ await db.prepare(`INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).bind(key,String(value??'')).run(); }
export async function isConfigured(db){ return (await getSetting(db,'setup_complete'))==='1'; }
