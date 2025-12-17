-- Simple SQL Script to Update Permissions
-- Run this in HeidiSQL, phpMyAdmin, or MySQL command line

-- Step 1: Check current permissions
SELECT id, name, email, is_super_admin, permissions
FROM users
WHERE role = 'admin';

-- Step 2: Grant all action-level permissions to super admin (harisnaseer3@gmail.com)
UPDATE users
SET permissions = '["view_plots","create_plots","edit_plots","delete_plots","import_plots","export_plots","view_leads","create_leads","edit_leads","delete_leads","assign_leads","export_leads","view_users","create_users","edit_users","delete_users","manage_user_permissions","view_settings","edit_settings"]'
WHERE email = 'harisnaseer3@gmail.com'
AND role = 'admin';

-- Step 3: For other admin users, grant all permissions (you can customize this later)
-- This gives them full access initially, then you can customize in the Settings UI
UPDATE users
SET permissions = '["view_plots","create_plots","edit_plots","delete_plots","import_plots","export_plots","view_leads","create_leads","edit_leads","delete_leads","assign_leads","export_leads","view_users","create_users","edit_users","delete_users","manage_user_permissions","view_settings","edit_settings"]'
WHERE role = 'admin'
AND email != 'harisnaseer3@gmail.com';

-- Step 4: Verify the results
SELECT id, name, email, is_super_admin, permissions
FROM users
WHERE role = 'admin';
