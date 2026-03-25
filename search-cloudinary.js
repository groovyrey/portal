const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function searchByFolder() {
  const folders = ['mobile', 'desktop'];
  
  console.log('--- Cloudinary Advanced Search ---');
  
  for (const folder of folders) {
    try {
      console.log(`Searching for folder: ${folder}`);
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .execute();
      
      console.log(`Results for ${folder}: ${result.resources.length}`);
      result.resources.forEach(img => {
        console.log(` - Public ID: ${img.public_id} | Asset Folder: ${img.folder}`);
      });
    } catch (e) {
      console.error(`Error searching ${folder}:`, e.message);
    }
  }
}

searchByFolder();
