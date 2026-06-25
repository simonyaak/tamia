<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Vehicles', 'icon' => 'ph-car'],
            ['name' => 'Mobile Phones & Tablets', 'icon' => 'ph-device-mobile'],
            ['name' => 'Electronics', 'icon' => 'ph-television'],
            ['name' => 'Real Estate', 'icon' => 'ph-house-line'],
            ['name' => 'Home, Furniture & Appliances', 'icon' => 'ph-armchair'],
            ['name' => 'Fashion', 'icon' => 'ph-t-shirt'],
            ['name' => 'Jobs', 'icon' => 'ph-briefcase'],
            ['name' => 'Services', 'icon' => 'ph-wrench'],
            ['name' => 'Agriculture & Food', 'icon' => 'ph-leaf'],
            ['name' => 'Animals & Pets', 'icon' => 'ph-dog'],
            ['name' => 'Health & Beauty', 'icon' => 'ph-heart-beat'],
            ['name' => 'Babies & Kids', 'icon' => 'ph-baby'],
        ];

        foreach ($categories as $index => $cat) {
            Category::create([
                'name' => $cat['name'],
                'slug' => Str::slug($cat['name']),
                'icon' => $cat['icon'],
                'order' => $index,
            ]);
        }
    }
}
