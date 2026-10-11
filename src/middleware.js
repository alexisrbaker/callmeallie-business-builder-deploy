import { defineMiddleware } from 'astro:middleware';
import { dbFrom } from './lib/db.js';
import { captureAffiliateAttribution } from './lib/affiliate-attribution.js';
export const onRequest=defineMiddleware(async(context,next)=>{
  const ref=context.url.searchParams.get('aff');
  if(ref){try{await captureAffiliateAttribution(dbFrom(context.locals),context.cookies,ref);}catch(e){console.error('affiliate attribution capture',e);}}
  return next();
});