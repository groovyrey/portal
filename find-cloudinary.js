const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function findImages() {
  console.log('--- Searching all Cloudinary images ---');
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 50
    });
    console.log(`Total images found: ${result.resources.length}`);
    result.resources.forEach(img => {
      console.log(` - ID: ${img.public_id} | Folder: ${img.folder}`);
    });

    console.log('\n--- Checking folders with subfolders=true ---');
    const foldersResult = await cloudinary.api.sub_folders('samples');
    console.log('Samples subfolders:', foldersResult.folders.map(f => f.name));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findImages();
