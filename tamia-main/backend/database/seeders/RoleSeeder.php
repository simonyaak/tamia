<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        Permission::create(['name' => 'manage listings']);
        Permission::create(['name' => 'manage users']);
        Permission::create(['name' => 'manage reports']);
        Permission::create(['name' => 'create listing']);
        Permission::create(['name' => 'edit own listing']);
        Permission::create(['name' => 'delete own listing']);

        // Create Roles and assign permissions
        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        $seller = Role::create(['name' => 'seller']);
        $seller->givePermissionTo(['create listing', 'edit own listing', 'delete own listing']);

        $buyer = Role::create(['name' => 'buyer']);
    }
}
