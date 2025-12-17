-- Manual SQL Script to Update to Action-Level Permissions
-- Run this in MySQL if you cannot run the migration due to PHP version

-- Update existing permissions from module-level to action-level
-- This converts old permissions to their new action-level equivalents

-- Backup current permissions (optional but recommended)
-- CREATE TABLE users_permissions_backup AS SELECT id, name, email, permissions FROM users WHERE role = 'admin';

-- Convert manage_plots to all plot permissions
UPDATE users
SET permissions = JSON_ARRAY(
    'view_plots',
    'create_plots',
    'edit_plots',
    'delete_plots',
    'import_plots',
    'export_plots'
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_plots"', '$');

-- Convert manage_leads to all lead permissions
UPDATE users
SET permissions = JSON_MERGE_PRESERVE(
    COALESCE(permissions, JSON_ARRAY()),
    JSON_ARRAY(
        'view_leads',
        'create_leads',
        'edit_leads',
        'delete_leads',
        'assign_leads',
        'export_leads'
    )
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_leads"', '$');

-- Convert manage_users to all user permissions
UPDATE users
SET permissions = JSON_MERGE_PRESERVE(
    COALESCE(permissions, JSON_ARRAY()),
    JSON_ARRAY(
        'view_users',
        'create_users',
        'edit_users',
        'delete_users',
        'manage_user_permissions'
    )
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_users"', '$');

-- Convert manage_settings to all settings permissions
UPDATE users
SET permissions = JSON_MERGE_PRESERVE(
    COALESCE(permissions, JSON_ARRAY()),
    JSON_ARRAY(
        'view_settings',
        'edit_settings'
    )
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_settings"', '$');

-- Remove old module-level permissions
UPDATE users
SET permissions = JSON_REMOVE(
    permissions,
    JSON_UNQUOTE(JSON_SEARCH(permissions, 'one', 'manage_plots'))
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_plots"', '$');

UPDATE users
SET permissions = JSON_REMOVE(
    permissions,
    JSON_UNQUOTE(JSON_SEARCH(permissions, 'one', 'manage_leads'))
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_leads"', '$');

UPDATE users
SET permissions = JSON_REMOVE(
    permissions,
    JSON_UNQUOTE(JSON_SEARCH(permissions, 'one', 'manage_users'))
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_users"', '$');

UPDATE users
SET permissions = JSON_REMOVE(
    permissions,
    JSON_UNQUOTE(JSON_SEARCH(permissions, 'one', 'manage_settings'))
)
WHERE role = 'admin'
AND JSON_CONTAINS(permissions, '"manage_settings"', '$');

-- Verify the results
SELECT id, name, email, is_super_admin, permissions
FROM users
WHERE role = 'admin';
