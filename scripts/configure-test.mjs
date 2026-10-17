import { writeFileSync } from 'node:fs';
const {ALLIE_TEST_DB_ID:db,ALLIE_TEST_BUCKET:bucket}=process.env;
if(!/^[0-9a-f-]{36}$/i.test(db||'') || !/^[a-z0-9-]+$/.test(bucket||'')) throw new Error('Test storage config missing');
const domain=(process.env.ALLIE_TEST_DOMAIN||'').trim().toLowerCase();
if(domain && (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$/.test(domain) || domain.endsWith('.workers.dev'))) throw new Error('Invalid custom domain');
let c = 'name = "allie-business-test"\nmain = "@astrojs/cloudflare/entrypoints/server"\ncompatibility_date = "2026-10-10"\n[assets]\ndirectory = "./dist"\nbinding = "STATIC_ASSETS"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "allie-business-test-db"\ndatabase_id = "'+db+'"\nmigrations_dir = "migrations"\n[[r2_buckets]]\nbinding = "ASSETS"\nbucket_name = "'+bucket+'"\n';
if(domain) c+='\n[[routes]]\npattern = "'+domain+'"\ncustom_domain = true\n';
writeFileSync('wrangler.installer-test.toml',c);
