import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    // List default images provided by Cloudinary (using 'samples' folder as a common location)
    // Cloudinary usually provides samples like 'sample', 'cld-sample-2', etc.
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'samples/', // Many default images are in the samples/ folder
      max_results: 50,
    });

    // If 'samples/' returns nothing, try the root
    if (result.resources.length === 0) {
      const rootResult = await cloudinary.api.resources({
        type: 'upload',
        max_results: 50,
      });
      return NextResponse.json(rootResult.resources);
    }

    return NextResponse.json(result.resources);
  } catch (error: any) {
    console.error('Cloudinary API error:', error);
    
    // Fallback if the above fails (e.g. if API keys are missing in the local env)
    // Common default public IDs in new Cloudinary accounts
    const fallbackImages = [
      { public_id: 'samples/animals/reindeer', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/animals/reindeer.jpg' },
      { public_id: 'samples/animals/three-dogs', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/animals/three-dogs.jpg' },
      { public_id: 'samples/animals/kitten-playing', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/animals/kitten-playing.jpg' },
      { public_id: 'samples/bike', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/bike.jpg' },
      { public_id: 'samples/coffee', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/coffee.jpg' },
      { public_id: 'samples/food/dessert', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/dessert.jpg' },
      { public_id: 'samples/food/fish-vegetables', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg' },
      { public_id: 'samples/landscapes/beach-boat', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/beach-boat.jpg' },
      { public_id: 'samples/landscapes/nature-mountains', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/nature-mountains.jpg' },
      { public_id: 'samples/people/smiling-man', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg' },
      { public_id: 'samples/people/kitchen-bar', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/people/kitchen-bar.jpg' },
      { public_id: 'samples/ecommerce/accessories-bag', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg' },
      { public_id: 'samples/ecommerce/car-interior-design', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/car-interior-design.jpg' },
      { public_id: 'samples/ecommerce/leather-bag-gray', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray.jpg' },
      { public_id: 'samples/ecommerce/shoes', secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoes.jpg' },
    ];
    
    return NextResponse.json(fallbackImages);
  }
}
