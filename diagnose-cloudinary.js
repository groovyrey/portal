const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function diagnose() {
  console.log('--- Cloudinary Diagnosis ---');
  console.log('Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  
  try {
    console.log('\n1. Testing root folders...');
    const folders = await cloudinary.api.root_folders();
    console.log('Folders found:', JSON.stringify(folders.folders.map(f => f.name), null, 2));

    const targetFolders = ['Home', 'mobile', 'desktop'];
    for (const folder of targetFolders) {
      console.log(`\n2. Testing folder: ${folder}...`);
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder + '/',
        max_results: 5
      });
      console.log(`Resources in ${folder}/:`, result.resources.length);
      if (result.resources.length > 0) {
        console.log('Sample URL:', result.resources[0].secure_url);
      }
    }

    console.log('\n3. Testing Home/mobile and Home/desktop...');
    const subFolders = ['Home/mobile', 'Home/desktop'];
    for (const folder of subFolders) {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder + '/',
        max_results: 5
      });
      console.log(`Resources in ${folder}/:`, result.resources.length);
    }

  } catch (error) {
    console.error('Error during diagnosis:', error.message);
  }
}

diagnose();
