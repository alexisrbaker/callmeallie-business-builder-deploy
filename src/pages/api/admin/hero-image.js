import { dbFrom, setSetting } from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/auth.js';
export const POST = async ({ request, locals }) => {
  const db = dbFrom(locals);
  const user = await getCurrentUser(db, request, locals);
  if (!user?.is_owner) return new Response('Forbidden', { status: 403 });
  const bucket = locals?.runtime?.env?.ASSETS;
  if (!bucket || !db) return new Response('Image storage or database is not configured', { status: 503 });
  const body = await request.formData();
  const file = body.get('hero_image');
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size) return new Response('Select an image', { status: 400 });
  if (file.size > 8 * 1024 * 1024) return new Response('Image must be 8 MB or smaller', { status: 413 });
  const mime = String(file.type || '').toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mime)) return new Response('Use JPEG, PNG, WebP, or AVIF', { status: 415 });
  const bytes = await file.arrayBuffer();
  const b = new Uint8Array(bytes);
  const valid = (mime==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255)||
    (mime==='image/png'&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)||
    (mime==='image/webp'&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')||
    (mime==='image/avif'&&String.fromCharCode(...b.slice(4,12)).includes('ftypavif'));
  if (!valid) return new Response('Invalid image data', { status: 415 });
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[mime];
  const key='site/hero-'+crypto.randomUUID()+'.'+ext;
  await bucket.put(key,bytes,{httpMetadata:{contentType:mime,cacheControl:'public, max-age=3600'}});
  await setSetting(db,'homepage_hero_image_key',key);
  return Response.redirect(new URL('/admin/settings?hero_saved=1',request.url),303);
};
