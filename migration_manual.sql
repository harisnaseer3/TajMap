-- Add new columns to users table
ALTER TABLE `users` 
ADD COLUMN `is_super_admin` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`,
ADD COLUMN `permissions` JSON NULL AFTER `is_super_admin`;

-- Set super admin flag for your email
UPDATE `users` 
SET `is_super_admin` = 1 
WHERE `email` = 'harisnaseer3@gmail.com' AND `role` = 'admin';

-- Give all other admin users full permissions
UPDATE `users` 
SET `permissions` = '["manage_plots","manage_leads","manage_users","manage_settings"]'
WHERE `role` = 'admin' AND `is_super_admin` = 0;
