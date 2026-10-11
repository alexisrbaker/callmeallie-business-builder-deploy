export async function validateCentralLicense(env,installationToken){
  if(!env?.LICENSE_AUTHORITY_URL||!installationToken)return {verified:false,active:false,reason:'not_configured'};
  try{const r=await fetch(`${env.LICENSE_AUTHORITY_URL}/api/licensing/validate`,{method:'POST',headers:{Authorization:`Bearer ${installationToken}`,'Content-Type':'application/json'},body:'{}'});if(!r.ok)return {verified:false,active:false,reason:'authority_error'};return await r.json();}catch{return {verified:false,active:false,reason:'unreachable'};}
}