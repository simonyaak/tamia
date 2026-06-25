<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\Category;
use App\Models\ListingImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

class ListingController extends Controller
{
    public function index()
    {
        $listings = auth()->user()->listings()->with('category', 'primaryImage')->latest()->paginate(10);
        return view('listings.index', compact('listings'));
    }

    public function create()
    {
        $categories = Category::whereNull('parent_id')->with('children')->get();
        return view('listings.create', compact('categories'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'city' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'condition' => 'required|in:new,used,refurbished',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // Max 5MB
        ]);

        $listing = auth()->user()->listings()->create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . uniqid(),
            'category_id' => $validated['category_id'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'city' => $validated['city'],
            'location' => $validated['location'],
            'condition' => $validated['condition'],
            'status' => 'active', // Default to active for immediate visibility
        ]);

        if ($request->hasFile('images')) {
            $cloudinaryUrl = env('CLOUDINARY_URL');
            
            foreach ($request->file('images') as $index => $image) {
                $path = null;

                if ($cloudinaryUrl) {
                    try {
                        Configuration::instance($cloudinaryUrl);
                        $uploadApi = new UploadApi();
                        $upload = $uploadApi->upload($image->getRealPath(), [
                            'folder' => 'tamia/listings/' . $listing->id
                        ]);
                        $path = $upload['secure_url'];
                    } catch (\Exception $e) {
                        // Fallback to local
                    }
                }

                if (! $path) {
                    $filename = Str::random(20) . '.' . $image->getClientOriginalExtension();
                    $path = 'listings/' . $listing->id . '/' . $filename;

                    if (extension_loaded('gd') || extension_loaded('imagick')) {
                        try {
                            $driver = extension_loaded('imagick') ? 'imagick' : 'gd';
                            $driverClass = $driver === 'imagick' ? ImagickDriver::class : GdDriver::class;
                            $manager = new ImageManager(new $driverClass());
                            
                            $img = $manager->read($image);
                            $img->scale(width: 1200);

                            Storage::disk('public')->put($path, (string) $img->encodeByExtension($image->getClientOriginalExtension()));
                        } catch (\Throwable $exception) {
                            Storage::disk('public')->putFileAs('listings/' . $listing->id, $image, $filename);
                        }
                    } else {
                        Storage::disk('public')->putFileAs('listings/' . $listing->id, $image, $filename);
                    }
                }

                ListingImage::create([
                    'listing_id' => $listing->id,
                    'path' => $path,
                    'is_primary' => $index === 0,
                    'order' => $index,
                ]);
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Listing posted successfully! It is now live on the marketplace.',
                'listing' => $listing->load('primaryImage', 'category'),
            ]);
        }

        return redirect()->route('listings.index')->with('success', 'Listing posted successfully!');
    }

    public function edit(Listing $listing)
    {
        $this->authorize('update', $listing);
        $categories = Category::whereNull('parent_id')->with('children')->get();
        return view('listings.edit', compact('listing', 'categories'));
    }

    public function update(Request $request, Listing $listing)
    {
        $this->authorize('update', $listing);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'city' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'condition' => 'required|in:new,used,refurbished',
            'status' => 'required|in:active,sold,pending',
        ]);

        $listing->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Listing updated successfully.',
                'listing' => $listing->load('primaryImage', 'category'),
            ]);
        }

        return redirect()->route('listings.index')->with('success', 'Listing updated successfully.');
    }

    public function destroy(Request $request, Listing $listing)
    {
        $this->authorize('delete', $listing);
        
        // Delete images from storage
        foreach ($listing->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $listing->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Listing deleted.']);
        }

        return redirect()->route('listings.index')->with('success', 'Listing deleted.');
    }
}
