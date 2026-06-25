<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Models\User;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SampleListingSeeder extends Seeder
{
    public function run(): void
    {
        $seller = User::where('email', 'seller@myjiji.ug')->first();
        if (!$seller) return;

        $categories = Category::all();

        $items = [
            ['title' => 'Toyota Hilux 2022', 'price' => 4500000, 'category' => 'Vehicles', 'city' => 'Kampala'],
            ['title' => 'iPhone 15 Pro Max 256GB', 'price' => 120000, 'category' => 'Mobile Phones & Tablets', 'city' => 'Kampala'],
            ['title' => '3 Bedroom House in Munyonyo', 'price' => 15000000, 'category' => 'Real Estate', 'city' => 'Kampala'],
            ['title' => 'Samsung 55" UHD TV', 'price' => 85000, 'category' => 'Electronics', 'city' => 'Entebbe'],
            ['title' => 'Modern Sofa Set', 'price' => 150000, 'category' => 'Home, Furniture & Appliances', 'city' => 'Jinja'],
        ];

        foreach ($items as $item) {
            $cat = Category::where('name', $item['category'])->first();
            
            Listing::create([
                'user_id' => $seller->id,
                'category_id' => $cat->id ?? $categories->random()->id,
                'title' => $item['title'],
                'slug' => Str::slug($item['title']) . '-' . rand(100, 999), 
                'description' => 'This is a sample description for ' . $item['title'] . '. High quality and reliable.',
                'price' => $item['price'],
                'location' => $item['city'] . ', Uganda',
                'city' => $item['city'],
                'condition' => 'used',
                'status' => 'active',
                'is_featured' => rand(0, 1),
                'views_count' => rand(10, 500),
            ]);
        }
    }
}
