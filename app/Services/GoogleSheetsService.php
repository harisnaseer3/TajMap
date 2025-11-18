<?php

namespace App\Services;

use App\Models\Plot;
use Google\Client;
use Google\Service\Sheets;
use Illuminate\Support\Facades\Log;
use Exception;

class GoogleSheetsService
{
    private $client;
    private $service;

    public function __construct()
    {
        $this->initializeClient();
    }

    /**
     * Initialize Google Sheets API client
     */
    private function initializeClient()
    {
        try {
            $this->client = new Client();
            $this->client->setApplicationName(config('app.name'));
            $this->client->setScopes([Sheets::SPREADSHEETS_READONLY]);

            // Set up authentication using service account JSON
            $credentialsPath = storage_path('app/google-credentials.json');

            if (!file_exists($credentialsPath)) {
                Log::warning('Google Sheets credentials file not found at: ' . $credentialsPath);
                return;
            }

            $this->client->setAuthConfig($credentialsPath);
            $this->service = new Sheets($this->client);
        } catch (Exception $e) {
            Log::error('Failed to initialize Google Sheets client: ' . $e->getMessage());
        }
    }

    /**
     * Sync plots from Google Sheets to database
     *
     * @param string $spreadsheetId The Google Sheets ID
     * @param string $range The range to read (e.g., 'Sheet1!A2:I')
     * @return array Statistics about the sync operation
     */
    public function syncPlots($spreadsheetId, $range = 'Sheet1!A2:Z')
    {
        if (!$this->service) {
            throw new Exception('Google Sheets service not initialized. Please check credentials.');
        }

        $stats = [
            'total_rows' => 0,
            'added' => 0,
            'updated' => 0,
            'errors' => 0,
            'error_details' => []
        ];

        try {
            // Fetch data from Google Sheets
            $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
            $values = $response->getValues();

            if (empty($values)) {
                Log::info('No data found in Google Sheets');
                return $stats;
            }

            $stats['total_rows'] = count($values);

            foreach ($values as $index => $row) {
                try {
                    $this->processRow($row, $stats);
                } catch (Exception $e) {
                    $stats['errors']++;
                    $stats['error_details'][] = [
                        'row' => $index + 2, // +2 because row 1 is header, array is 0-indexed
                        'error' => $e->getMessage()
                    ];
                    Log::error("Error processing row " . ($index + 2) . ": " . $e->getMessage());
                }
            }

            Log::info('Google Sheets sync completed', $stats);
        } catch (Exception $e) {
            Log::error('Google Sheets sync failed: ' . $e->getMessage());
            throw $e;
        }

        return $stats;
    }

    /**
     * Process a single row from the spreadsheet
     *
     * @param array $row Row data from spreadsheet
     * @param array &$stats Reference to stats array
     */
    private function processRow($row, &$stats)
    {
        // Skip empty rows - check if Name column (index 1) is empty
        if (empty($row[1]) || trim($row[1]) === '') {
            return;
        }

        // Skip header rows (safety check)
        $nameValue = strtolower(trim($row[1]));
        if ($nameValue === 'name' || $nameValue === 'plot name') {
            return;
        }

        // Map columns based on actual sheet structure:
        // Column A (0): Sr No. - IGNORED
        // Column B (1): Name → plot_number
        // Column C (2): Size → area
        // Column D (3): Sector → sector
        // Column E (4): Street → street
        // Column F (5): Type → type
        // Column G (6): Category → category
        // Column H (7): Status → status
        // Column I (8): Actions → description
        $plotNumber = $this->convertToString($row[1] ?? null);
        $area = $this->parseArea($row[2] ?? null);
        $sector = $this->convertToString($row[3] ?? null);
        $street = $this->convertToString($row[4] ?? null);
        $type = $this->convertToString($row[5] ?? null);
        $category = $this->convertToString($row[6] ?? null);
        $status = $this->mapStatus($row[7] ?? 'available');
        $description = $this->convertToString($row[8] ?? null);

        // Check if plot exists
        $plot = Plot::where('plot_number', $plotNumber)->first();

        $plotData = [
            'plot_number' => $plotNumber,
            'area' => $area,
            'sector' => $sector,
            'street' => $street,
            'type' => $type,
            'category' => $category,
            'status' => $status,
            'description' => $description,
        ];

        if ($plot) {
            // Update existing plot
            $plot->update($plotData);
            $stats['updated']++;
        } else {
            // Create new plot
            Plot::create($plotData);
            $stats['added']++;
        }
    }

    /**
     * Convert value to string
     */
    private function convertToString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        return trim((string) $value);
    }

    /**
     * Parse area from various formats
     */
    private function parseArea($size): ?float
    {
        if (empty($size)) {
            return null;
        }

        $size = trim((string) $size);

        if (is_numeric($size)) {
            return (float) $size;
        }

        // Handle dimension formats like "25x50" or "25*50"
        if (preg_match('/^(\d+\.?\d*)\s*[x*×]\s*(\d+\.?\d*)$/i', $size, $matches)) {
            $length = (float) $matches[1];
            $width = (float) $matches[2];
            return $length * $width;
        }

        return null;
    }

    /**
     * Map status values to valid enum values
     */
    private function mapStatus(?string $status): string
    {
        $statusLower = strtolower(trim($status ?? ''));

        $statusMap = [
            'available' => 'available',
            'active' => 'available',
            'reserved' => 'reserved',
            'hold' => 'hold',
            'sold' => 'sold',
        ];

        return $statusMap[$statusLower] ?? 'available';
    }

    /**
     * Extract spreadsheet ID from Google Sheets URL
     */
    public static function extractSpreadsheetId($url): ?string
    {
        // Pattern: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
        if (preg_match('/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $url, $matches)) {
            return $matches[1];
        }

        // If it's already just an ID, return it
        if (preg_match('/^[a-zA-Z0-9-_]+$/', $url)) {
            return $url;
        }

        return null;
    }
}
