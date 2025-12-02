<?php

namespace App\Console\Commands;

use App\Services\GoogleSheetsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncGoogleSheets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sheets:sync {--spreadsheet-id= : The Google Sheets spreadsheet ID} {--range= : The range to read}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync plots data from Google Sheets to database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Google Sheets sync...');

        try {
            // Get spreadsheet ID from option or config
            $spreadsheetId = $this->option('spreadsheet-id') ?? config('services.google_sheets.spreadsheet_id');

            if (!$spreadsheetId) {
                $this->error('No spreadsheet ID provided. Use --spreadsheet-id option or set GOOGLE_SHEETS_SPREADSHEET_ID in .env');
                return 1;
            }

            // Get range
            $range = $this->option('range') ?? config('services.google_sheets.range', 'Sheet1!A2:Z');

            // Extract ID from URL if needed
            $extractedId = GoogleSheetsService::extractSpreadsheetId($spreadsheetId);
            if (!$extractedId) {
                $this->error('Invalid spreadsheet ID or URL format');
                return 1;
            }

            $this->info("Spreadsheet ID: {$extractedId}");
            $this->info("Range: {$range}");

            // Perform sync
            $service = new GoogleSheetsService();
            $stats = $service->syncPlots($extractedId, $range);

            // Display results
            $this->newLine();
            $this->info('Sync completed successfully!');
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Total rows processed', $stats['total_rows']],
                    ['New plots added', $stats['added']],
                    ['Plots updated', $stats['updated']],
                    ['Errors', $stats['errors']],
                ]
            );

            if ($stats['errors'] > 0 && !empty($stats['error_details'])) {
                $this->warn('Errors encountered:');
                $this->table(
                    ['Row', 'Error'],
                    array_map(fn($error) => [$error['row'], $error['error']], $stats['error_details'])
                );
            }

            return 0;
        } catch (\Exception $e) {
            $this->error('Sync failed: ' . $e->getMessage());
            Log::error('Google Sheets sync command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}
