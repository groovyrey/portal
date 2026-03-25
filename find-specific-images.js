const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function findMobileImages() {
  try {
    console.log('--- Searching for "mobile" or "desktop" in ALL resources ---');
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500
    });

    const mobileImages = result.resources.filter(img => 
      img.public_id.toLowerCase().includes('mobile') || 
      (img.folder && img.folder.toLowerCase().includes('mobile'))
    );

    const desktopImages = result.resources.filter(img => 
      img.public_id.toLowerCase().includes('desktop') || 
      (img.folder && img.folder.toLowerCase().includes('desktop'))
    );

    console.log(`Total Mobile Images found: ${mobileImages.length}`);
    mobileImages.forEach(img => console.log(` - ID: ${img.public_id} | Folder: ${img.folder}`));

    console.log(`\nTotal Desktop Images found: ${desktopImages.length}`);
    desktopImages.forEach(img => console.log(` - ID: ${img.public_id} | Folder: ${img.folder}`));

    if (mobileImages.length === 0 && desktopImages.length === 0) {
        console.log('\nNo images found with those names. Showing first 10 root images for context:');
        result.resources.slice(0, 10).forEach(img => console.log(` - ID: ${img.public_id}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findMobileImages();
