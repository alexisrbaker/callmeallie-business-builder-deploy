import { dbFrom, getSetting } from '../../lib/db.js';
export const GET = async ({ locals }) => {
  const db=dbFrom(locals), bucket=locals?.runtime?.env?.ASSETS;
  if(!db||!bucket) return new Response('Image not configured',{status:404});
  const key=await getSetting(db,'homepage_hero_image_key');
  if(!key||!key.startsWith('site/hero-')) return new Response('Image not configured',{status:404});
  const obj=await bucket.get(key);
  if(!obj) return new Response('Image not found',{status:404});
  const headers=new Headers();
  headers.set('Content-Type',obj.httpMetadata?.contentType||'image/jpeg');
  headers.set('Cache-Control','public, max-age=300');
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(obj.body,{headers});
};
