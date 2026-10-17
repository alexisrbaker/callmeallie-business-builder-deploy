import { writeFileSync } from 'node:fs';
const {ALLIE_TEST_DB_ID:db,ALLIE_TEST_BUCKET:bucket}=process.env;
if(!/^[0-9a-f-]{36}$/i.test(db||'') || !/^[a-z0-9-]+$/.test(bucket||'')) throw new Error('Test storage config missing');
const c = 'name = "allie-business-test"\nmain = "@astrojs/cloudflare/entrypoints/server"\ncompatibility_date = "2026-10-10"\n[assets]\ndirectory = "./dist"\nbinding = "STATIC_ASSETS"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "allie-business-test-db"\ndatabase_id = "'+db+'"\nmigrations_dir = "migrations"\n[[r2_buckets]]\nbinding = "ASSETS"\nbucket_name = "'+bucket+'"\n';
writeFileSync('wrangler.installer-test.toml',c);
