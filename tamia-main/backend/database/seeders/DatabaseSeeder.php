<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            CategorySeeder::class,
        ]);

        $admin = User::factory()->create([
            'name' => 'Admin Owner',
            'email' => 'admin@myjiji.ug',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'admin',
        ]);
        $admin->assignRole('admin');

        $seller = User::factory()->create([
            'name' => 'Sample Seller',
            'email' => 'seller@myjiji.ug',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'seller',
        ]);
        $seller->assignRole('seller');

        $this->call([
            SampleListingSeeder::class,
        ]);
    }
}
