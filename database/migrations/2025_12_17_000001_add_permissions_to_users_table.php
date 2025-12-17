<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('role');
            $table->json('permissions')->nullable()->after('is_super_admin');
        });

        // Set super admin flag for specific email
        DB::table('users')
            ->where('email', 'harisnaseer3@gmail.com')
            ->where('role', 'admin')
            ->update(['is_super_admin' => true]);

        // Give all existing admin users full permissions (except super admin)
        $allPermissions = json_encode([
            'manage_plots',
            'manage_leads',
            'manage_users',
            'manage_settings',
        ]);

        DB::table('users')
            ->where('role', 'admin')
            ->where('is_super_admin', false)
            ->update(['permissions' => $allPermissions]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_super_admin', 'permissions']);
        });
    }
};
