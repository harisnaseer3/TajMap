<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General Settings
            [
                'key' => 'site_name',
                'value' => 'TajMap',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Site Name',
                'description' => 'The name of your website',
            ],
            [
                'key' => 'site_description',
                'value' => 'Real Estate Plot Management System',
                'type' => 'textarea',
                'group' => 'general',
                'label' => 'Site Description',
                'description' => 'A brief description of your website',
            ],
            [
                'key' => 'contact_email',
                'value' => 'contact@tajmap.com',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Contact Email',
                'description' => 'Primary contact email address',
            ],
            [
                'key' => 'contact_phone',
                'value' => '+92 123 4567890',
                'type' => 'string',
                'group' => 'general',
                'label' => 'Contact Phone',
                'description' => 'Primary contact phone number',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'general',
                'label' => 'Maintenance Mode',
                'description' => 'Enable maintenance mode to prevent public access',
            ],

            // Email Settings
            [
                'key' => 'email_from_address',
                'value' => 'noreply@tajmap.com',
                'type' => 'string',
                'group' => 'email',
                'label' => 'From Email Address',
                'description' => 'Email address used for outgoing emails',
            ],
            [
                'key' => 'email_from_name',
                'value' => 'TajMap',
                'type' => 'string',
                'group' => 'email',
                'label' => 'From Name',
                'description' => 'Name displayed in outgoing emails',
            ],
            [
                'key' => 'email_notifications',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'email',
                'label' => 'Email Notifications',
                'description' => 'Enable/disable email notifications',
            ],

            // Lead Settings
            [
                'key' => 'lead_auto_assignment',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'leads',
                'label' => 'Auto Assignment',
                'description' => 'Automatically assign leads to admins',
            ],
            [
                'key' => 'lead_max_per_admin',
                'value' => '50',
                'type' => 'number',
                'group' => 'leads',
                'label' => 'Max Leads Per Admin',
                'description' => 'Maximum number of leads per admin user',
            ],
            [
                'key' => 'lead_follow_up_days',
                'value' => '7',
                'type' => 'number',
                'group' => 'leads',
                'label' => 'Follow-up Days',
                'description' => 'Days before lead follow-up reminder',
            ],

            // Plot Settings
            [
                'key' => 'plot_default_status',
                'value' => 'Available',
                'type' => 'string',
                'group' => 'plots',
                'label' => 'Default Status',
                'description' => 'Default status for new plots',
            ],
            [
                'key' => 'plot_image_max_size',
                'value' => '5',
                'type' => 'number',
                'group' => 'plots',
                'label' => 'Max Image Size (MB)',
                'description' => 'Maximum file size for plot images in megabytes',
            ],
            [
                'key' => 'plot_featured_limit',
                'value' => '10',
                'type' => 'number',
                'group' => 'plots',
                'label' => 'Featured Plots Limit',
                'description' => 'Number of featured plots to display',
            ],

            // Appearance Settings
            [
                'key' => 'theme_primary_color',
                'value' => '#3B82F6',
                'type' => 'string',
                'group' => 'appearance',
                'label' => 'Primary Color',
                'description' => 'Primary theme color (hex code)',
            ],
            [
                'key' => 'items_per_page',
                'value' => '20',
                'type' => 'number',
                'group' => 'appearance',
                'label' => 'Items Per Page',
                'description' => 'Default pagination items per page',
            ],
            [
                'key' => 'show_plot_prices',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'appearance',
                'label' => 'Show Plot Prices',
                'description' => 'Display plot prices on public pages',
            ],

            // Map Settings
            [
                'key' => 'map_default_zoom',
                'value' => '15',
                'type' => 'number',
                'group' => 'map',
                'label' => 'Default Zoom Level',
                'description' => 'Default map zoom level (1-20)',
            ],
            [
                'key' => 'map_center_latitude',
                'value' => '31.5204',
                'type' => 'string',
                'group' => 'map',
                'label' => 'Center Latitude',
                'description' => 'Default map center latitude',
            ],
            [
                'key' => 'map_center_longitude',
                'value' => '74.3587',
                'type' => 'string',
                'group' => 'map',
                'label' => 'Center Longitude',
                'description' => 'Default map center longitude',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
