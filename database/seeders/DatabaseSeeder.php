<?php

namespace Database\Seeders;

use App\Models\Plot;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@tajmap.com',
            'password' => Hash::make('password'),
            'phone' => '+1234567890',
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        echo "Admin user created: admin@tajmap.com / password\n";

        // Create regular user
        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@tajmap.com',
            'password' => Hash::make('password'),
            'phone' => '+0987654321',
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        echo "Regular user created: user@tajmap.com / password\n";

        // Create sample plots
        $this->createSamplePlots();
    }

    /**
     * Create sample plots with normalized coordinates
     */
    private function createSamplePlots(): void
    {
        $sectors = ['A', 'B', 'C', 'D'];
        $blocks = ['1', '2', '3', '4'];
        $statuses = ['available', 'reserved', 'sold'];

        $plotNumber = 1;

        foreach ($sectors as $sectorIndex => $sector) {
            foreach ($blocks as $blockIndex => $block) {
                for ($i = 1; $i <= 5; $i++) {
                    // Generate polygon coordinates (normalized 0-1)
                    // Position based on sector and block
                    $baseX = ($sectorIndex * 0.25) + ($blockIndex * 0.05);
                    $baseY = ($blockIndex * 0.25) + ($sectorIndex * 0.05);
                    $offsetX = ($i - 1) * 0.04;
                    $offsetY = (($i - 1) % 2) * 0.04;

                    // Create a rectangle plot
                    $width = 0.03;
                    $height = 0.04;

                    $coordinates = [
                        ['x' => $baseX + $offsetX, 'y' => $baseY + $offsetY],
                        ['x' => $baseX + $offsetX + $width, 'y' => $baseY + $offsetY],
                        ['x' => $baseX + $offsetX + $width, 'y' => $baseY + $offsetY + $height],
                        ['x' => $baseX + $offsetX, 'y' => $baseY + $offsetY + $height],
                    ];

                    // Random area between 1000-5000 sq ft
                    $area = rand(1000, 5000);

                    // Price calculation: $50-$100 per sq ft
                    $pricePerSqFt = rand(50, 100);
                    $price = $area * $pricePerSqFt;

                    Plot::create([
                        'plot_number' => sprintf('%s-%s-%03d', $sector, $block, $plotNumber),
                        'sector' => $sector,
                        'block' => $block,
                        'coordinates' => $coordinates,
                        'status' => $statuses[array_rand($statuses)],
                        'area' => $area,
                        'price' => $price,
                        'description' => "Prime real estate plot in Sector {$sector}, Block {$block}",
                        'features' => [
                            'road_access' => rand(0, 1) === 1,
                            'electricity' => rand(0, 1) === 1,
                            'water_supply' => rand(0, 1) === 1,
                            'corner_plot' => ($i === 1 || $i === 5),
                        ],
                    ]);

                    $plotNumber++;
                }
            }
        }

        echo "Created 80 sample plots\n";
    }
}
