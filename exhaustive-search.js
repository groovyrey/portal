const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function exhaustiveSearch() {
  const types = ['upload', 'private', 'authenticated'];
  const folders = ['mobile', 'desktop', 'Home/mobile', 'Home/desktop'];

  console.log('--- Exhaustive Cloudinary Search ---');

  for (const type of types) {
    for (const folder of folders) {
      try {
        const result = await cloudinary.api.resources({
          type: type,
          prefix: folder + '/',
          max_results: 10
        });
        if (result.resources.length > 0) {
          console.log(`FOUND: [${type}] in folder [${folder}/] - ${result.resources.length} items`);
          console.log(`Sample ID: ${result.resources[0].public_id}`);
        } else {
          console.log(`Empty: [${type}] in folder [${folder}/]`);
        }
      } catch (e) {
        console.log(`Error searching [${type}] in [${folder}/]: ${e.message}`);
      }
    }
  }
}

exhaustiveSearch();
