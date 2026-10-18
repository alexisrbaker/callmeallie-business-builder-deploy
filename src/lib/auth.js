const LOCAL_COOKIE='business_session';
const SHARED_COOKIE='allie_session_v2';
const LEGACY_SHARED_COOKIE='allie_session';
const enc=new TextEncoder();
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function bytes(hexstr){return new Uint8Array((hexstr||'').match(/.{1,2}/g)?.map(x=>parseInt(x,16))||[])}
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function fromB64(s){const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
export function randomId(bytesLen=24){const a=new Uint8Array(bytesLen);crypto.getRandomValues(a);return hex(a)}
export function getCookies(request,name){const h=request.headers.get('Cookie')||'';const out=[];for(const p of h.split(';')){const [k,...v]=p.trim().split('=');if(k===name){try{out.push(decodeURIComponent(v.join('=')))}catch{out.push(v.join('='))}}}return out.filter(Boolean)}
export function getCookie(request,name=LOCAL_COOKIE){return getCookies(request,name)[0]||''}
export async function hashPassword(password){const salt=crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const out=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},key,256);return `pbkdf2$210000$${hex(salt)}$${hex(out)}`}
export async function verifyPassword(password,stored){try{const [kind,it,saltHex,hashHex]=stored.split('$');if(kind!=='pbkdf2')return false;const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const out=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(saltHex),iterations:Number(it),hash:'SHA-256'},key,256));const expected=bytes(hashHex);if(out.length!==expected.length)return false;let diff=0;for(let i=0;i<out.length;i++)diff|=out[i]^expected[i];return diff===0}catch{return false}}
export async function verifySharedPassword(password,storedHash,storedSalt){try{const salt=fromB64(storedSalt);const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const out=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));const got=b64(out);if(got.length!==storedHash.length)return false;let diff=0;for(let i=0;i<got.length;i++)diff|=got.charCodeAt(i)^storedHash.charCodeAt(i);return diff===0}catch{return false}}
export async function hashSharedPassword(password){const salt=crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const out=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256));return {hash:b64(out),salt:b64(salt)}}
async function syncBusinessUser(db,user,{owner=false}={}){if(!db||!user)return user;const id=String(user.id);await db.prepare(`INSERT INTO users(id,email,display_name,password_hash,status,is_owner) VALUES(?,?,?,'','active',?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,status='active',is_owner=CASE WHEN users.is_owner=1 THEN 1 ELSE excluded.is_owner END`).bind(id,user.email,user.display_name||'',owner?1:0).run();return {...user,id,is_owner:owner?1:((await db.prepare('SELECT is_owner FROM users WHERE id=?').bind(id).first())?.is_owner||0)}}
export function hasSharedIdentity(locals){return Boolean(locals?.runtime?.env?.IDENTITY_DB)}
export async function getCurrentUser(db,request,locals=null){
 if(!db)return null;
 const localId=getCookie(request);
 if(localId){
  const local=await db.prepare(`SELECT u.id,u.email,u.display_name,u.status,u.is_owner FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>CURRENT_TIMESTAMP AND u.status='active' LIMIT 1`).bind(localId).first();
  if(local)return local;
 }
 const identity=locals?.runtime?.env?.IDENTITY_DB||null;
 if(!identity)return null;
 const ids=[...getCookies(request,SHARED_COOKIE),...getCookies(request,LEGACY_SHARED_COOKIE)];
 for(const sid of [...new Set(ids)]){
  const u=await identity.prepare(`SELECT users.id,users.email,users.display_name,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=? AND sessions.expires_at>? LIMIT 1`).bind(sid,new Date().toISOString()).first();
  if(u)return await syncBusinessUser(db,u,{owner:['owner','admin'].includes(u.role)});
 }
 return null;
}
export async function createSession(db,userId,{shared=false}={}){if(shared){const id=crypto.randomUUID();const expires=new Date(Date.now()+14*86400000).toISOString();await db.prepare(`INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)`).bind(id,userId,expires).run();return id}const id=randomId();await db.prepare(`INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))`).bind(id,userId).run();return id}
export function sessionCookie(id,request,{shared=false}={}){if(shared)return `${SHARED_COOKIE}=${encodeURIComponent(id)}; Path=/; Domain=.callmeallie.com; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600`;const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${LOCAL_COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`}
export function clearSessionCookie(request,{shared=false}={}){if(shared)return `${SHARED_COOKIE}=; Path=/; Domain=.callmeallie.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${LOCAL_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`}
export async function loginUser(db,request,locals,email,password){
 if(!db)return null;
 const identity=locals?.runtime?.env?.IDENTITY_DB||null;
 if(identity){
  const u=await identity.prepare(`SELECT id,email,display_name,role,password_hash,password_salt FROM users WHERE lower(email)=? LIMIT 1`).bind(email).first();
  if(u){
   if(!await verifySharedPassword(password,u.password_hash,u.password_salt))return null;
   const business=await syncBusinessUser(db,u,{owner:['owner','admin'].includes(u.role)});
   const sid=await createSession(identity,u.id,{shared:true});
   return {user:business,cookie:sessionCookie(sid,request,{shared:true})};
  }
 }
 const u=await db.prepare(`SELECT id,email,display_name,password_hash,status,is_owner FROM users WHERE lower(email)=? LIMIT 1`).bind(email).first();
 if(!u||u.status!=='active'||!await verifyPassword(password,u.password_hash))return null;
 const sid=await createSession(db,u.id);
 return {user:u,cookie:sessionCookie(sid,request)};
}
export async function registerUser(db,request,locals,email,name,password,{owner=false}={}){
 if(!db)throw new Error('business_database_unavailable');
 const identity=locals?.runtime?.env?.IDENTITY_DB||null;
 if(identity){
  const exists=await identity.prepare('SELECT id FROM users WHERE lower(email)=? LIMIT 1').bind(email).first();
  if(exists)throw new Error('account_exists');
  const pw=await hashSharedPassword(password);
  const role=owner?'owner':'reader';
  const r=await identity.prepare(`INSERT INTO users(email,display_name,role,password_hash,password_salt,membership_tier,subscription_status,monthly_support_cents) VALUES(?,?,?,?,?,'free','none',0)`).bind(email,name,role,pw.hash,pw.salt).run();
  const id=String(r.meta.last_row_id);
  const sharedUser={id,email,display_name:name,role};
  const businessUser=await syncBusinessUser(db,sharedUser,{owner});
  const session=await createSession(identity,id,{shared:true});
  return {user:businessUser,cookie:sessionCookie(session,request,{shared:true})};
 }
 const id=randomId(),hash=await hashPassword(password);
 await db.prepare('INSERT INTO users(id,email,display_name,password_hash,is_owner) VALUES(?,?,?,?,?)').bind(id,email,name,hash,owner?1:0).run();
 const session=await createSession(db,id);
 return {user:{id,email,display_name:name,is_owner:owner?1:0},cookie:sessionCookie(session,request)};
}
export async function logoutUser(db,request,locals){
 const identity=locals?.runtime?.env?.IDENTITY_DB||null;
 const localId=getCookie(request);
 if(db&&localId)await db.prepare('DELETE FROM sessions WHERE id=?').bind(localId).run();
 if(identity){
  for(const sid of [...new Set([...getCookies(request,SHARED_COOKIE),...getCookies(request,LEGACY_SHARED_COOKIE)])]){
   await identity.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run();
  }
  return [clearSessionCookie(request,{shared:true}),clearSessionCookie(request)];
 }
 return clearSessionCookie(request);
}
