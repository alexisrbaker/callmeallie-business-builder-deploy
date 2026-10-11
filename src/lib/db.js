import { env } from 'cloudflare:workers';
export function dbFrom(){ return env.DB || null; }
export function identityDbFrom(){ return env.IDENTITY_DB || null; }
export async function getSetting(db,key){ if(!db)return null; const r=await db.prepare('SELECT value FROM site_settings WHERE key=? LIMIT 1').bind(key).first(); return r?.value ?? null; }
export async function isConfigured(db){ return (await getSetting(db,'setup_complete'))==='1'; }
