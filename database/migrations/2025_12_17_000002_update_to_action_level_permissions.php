<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all admin users
        $admins = DB::table('users')
            ->where('role', 'admin')
            ->where('is_super_admin', false)
            ->get();

        foreach ($admins as $admin) {
            $oldPermissions = json_decode($admin->permissions ?? '[]', true);
            $newPermissions = [];

            // Convert old module-level permissions to action-level permissions
            if (in_array('manage_plots', $oldPermissions)) {
                $newPermissions = array_merge($newPermissions, [
                    User::PERMISSION_VIEW_PLOTS,
                    User::PERMISSION_CREATE_PLOTS,
                    User::PERMISSION_EDIT_PLOTS,
                    User::PERMISSION_DELETE_PLOTS,
                    User::PERMISSION_IMPORT_PLOTS,
                    User::PERMISSION_EXPORT_PLOTS,
                ]);
            }

            if (in_array('manage_leads', $oldPermissions)) {
                $newPermissions = array_merge($newPermissions, [
                    User::PERMISSION_VIEW_LEADS,
                    User::PERMISSION_CREATE_LEADS,
                    User::PERMISSION_EDIT_LEADS,
                    User::PERMISSION_DELETE_LEADS,
                    User::PERMISSION_ASSIGN_LEADS,
                    User::PERMISSION_EXPORT_LEADS,
                ]);
            }

            if (in_array('manage_users', $oldPermissions)) {
                $newPermissions = array_merge($newPermissions, [
                    User::PERMISSION_VIEW_USERS,
                    User::PERMISSION_CREATE_USERS,
                    User::PERMISSION_EDIT_USERS,
                    User::PERMISSION_DELETE_USERS,
                    User::PERMISSION_MANAGE_USER_PERMISSIONS,
                ]);
            }

            if (in_array('manage_settings', $oldPermissions)) {
                $newPermissions = array_merge($newPermissions, [
                    User::PERMISSION_VIEW_SETTINGS,
                    User::PERMISSION_EDIT_SETTINGS,
                ]);
            }

            // Update user with new permissions
            if (!empty($newPermissions)) {
                DB::table('users')
                    ->where('id', $admin->id)
                    ->update(['permissions' => json_encode(array_unique($newPermissions))]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Get all admin users
        $admins = DB::table('users')
            ->where('role', 'admin')
            ->where('is_super_admin', false)
            ->get();

        foreach ($admins as $admin) {
            $permissions = json_decode($admin->permissions ?? '[]', true);
            $oldPermissions = [];

            // Convert back to module-level
            $plotPermissions = [
                User::PERMISSION_VIEW_PLOTS,
                User::PERMISSION_CREATE_PLOTS,
                User::PERMISSION_EDIT_PLOTS,
                User::PERMISSION_DELETE_PLOTS,
                User::PERMISSION_IMPORT_PLOTS,
                User::PERMISSION_EXPORT_PLOTS,
            ];

            $leadPermissions = [
                User::PERMISSION_VIEW_LEADS,
                User::PERMISSION_CREATE_LEADS,
                User::PERMISSION_EDIT_LEADS,
                User::PERMISSION_DELETE_LEADS,
                User::PERMISSION_ASSIGN_LEADS,
                User::PERMISSION_EXPORT_LEADS,
            ];

            $userPermissions = [
                User::PERMISSION_VIEW_USERS,
                User::PERMISSION_CREATE_USERS,
                User::PERMISSION_EDIT_USERS,
                User::PERMISSION_DELETE_USERS,
                User::PERMISSION_MANAGE_USER_PERMISSIONS,
            ];

            $settingsPermissions = [
                User::PERMISSION_VIEW_SETTINGS,
                User::PERMISSION_EDIT_SETTINGS,
            ];

            // If has any plot permission, add manage_plots
            if (count(array_intersect($permissions, $plotPermissions)) > 0) {
                $oldPermissions[] = 'manage_plots';
            }

            // If has any lead permission, add manage_leads
            if (count(array_intersect($permissions, $leadPermissions)) > 0) {
                $oldPermissions[] = 'manage_leads';
            }

            // If has any user permission, add manage_users
            if (count(array_intersect($permissions, $userPermissions)) > 0) {
                $oldPermissions[] = 'manage_users';
            }

            // If has any settings permission, add manage_settings
            if (count(array_intersect($permissions, $settingsPermissions)) > 0) {
                $oldPermissions[] = 'manage_settings';
            }

            // Update user with old permissions
            DB::table('users')
                ->where('id', $admin->id)
                ->update(['permissions' => json_encode($oldPermissions)]);
        }
    }
};
