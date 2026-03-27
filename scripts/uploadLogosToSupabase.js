require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const bucket = 'branding-assets';

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) throw bucketsError;

  const bucketExists = (buckets || []).some((b) => b.name === bucket);
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: '5MB'
    });
    if (createError) throw createError;
  }

  const files = [
    {
      local: path.join(process.cwd(), 'assets', 'logos', 'brickline-main.png'),
      remote: 'logos/brickline-main.png',
      contentType: 'image/png'
    },
    {
      local: path.join(process.cwd(), 'assets', 'logos', 'brickline-white.png'),
      remote: 'logos/brickline-white.png',
      contentType: 'image/png'
    }
  ];

  for (const file of files) {
    const binary = fs.readFileSync(file.local);
    const { error } = await supabase.storage.from(bucket).upload(file.remote, binary, {
      contentType: file.contentType,
      upsert: true
    });
    if (error) throw error;
  }

  const mainPublic = supabase.storage.from(bucket).getPublicUrl('logos/brickline-main.png');
  const whitePublic = supabase.storage.from(bucket).getPublicUrl('logos/brickline-white.png');

  console.log('MAIN_LOGO_URL=' + mainPublic.data.publicUrl);
  console.log('WHITE_LOGO_URL=' + whitePublic.data.publicUrl);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

