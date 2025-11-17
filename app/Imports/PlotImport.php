<?php

namespace App\Imports;

use App\Models\Plot;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Validation\Rule;

class PlotImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use SkipsErrors, SkipsFailures;

    /**
     * Specify which row contains the headers
     *
     * @return int
     */
    public function headingRow(): int
    {
        return 2; // Headers are in the second row (Row 1 may contain title/metadata)
    }

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // Skip empty rows (rows where name is empty/null)
        if (empty($row['name']) || trim($row['name']) === '') {
            return null;
        }

        // Skip if this looks like a header row (safety check)
        $nameValue = strtolower(trim($row['name']));
        if ($nameValue === 'name' || $nameValue === 'plot name') {
            return null;
        }

        // Parse size/area - handle formats like "25x50" or just "1250"
        $area = $this->parseArea($row['size'] ?? null);

        $plotNumber = $this->convertToString($row['name']);

        // Check if plot already exists
        $existingPlot = Plot::where('plot_number', $plotNumber)->first();

        // Try different possible column names for Type and Category
        $type = $this->getValueFromRow($row, ['type', 'plot_type', 'plottype']);
        $category = $this->getValueFromRow($row, ['category', 'plot_category', 'plotcategory']);

        $data = [
            'plot_number'  => $plotNumber,
            'area'         => $area,
            'sector'       => $this->convertToString($row['sector'] ?? null),
            'street'       => $this->convertToString($row['street'] ?? null),
            'type'         => $this->convertToString($type),
            'category'     => $this->convertToString($category),
            'status'       => $this->mapStatus($row['status'] ?? 'available'),
            'description'  => $this->convertToString($row['actions'] ?? null),
        ];

        if ($existingPlot) {
            // Update existing plot
            $existingPlot->update($data);
            return null; // Return null so it doesn't create a new record
        }

        // Create new plot
        return new Plot($data);
    }

    /**
     * Get value from row trying multiple possible column names
     *
     * @param array $row
     * @param array $possibleKeys
     * @return mixed
     */
    private function getValueFromRow(array $row, array $possibleKeys)
    {
        foreach ($possibleKeys as $key) {
            if (isset($row[$key]) && $row[$key] !== null && $row[$key] !== '') {
                return $row[$key];
            }
        }
        return null;
    }

    /**
     * Convert value to string, handling numeric values from Excel
     *
     * @param mixed $value
     * @return string|null
     */
    private function convertToString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Convert to string and trim
        return trim((string) $value);
    }

    /**
     * Parse area from various formats
     * Handles: "25x50", "25*50", "1250", etc.
     *
     * @param mixed $size
     * @return float|null
     */
    private function parseArea($size): ?float
    {
        if (empty($size)) {
            return null;
        }

        $size = trim((string) $size);

        // If it's already a number, return it
        if (is_numeric($size)) {
            return (float) $size;
        }

        // Handle dimension formats like "25x50" or "25*50"
        if (preg_match('/^(\d+\.?\d*)\s*[x*×]\s*(\d+\.?\d*)$/i', $size, $matches)) {
            $length = (float) $matches[1];
            $width = (float) $matches[2];
            return $length * $width;
        }

        // If we can't parse it, return null
        return null;
    }

    /**
     * Map status values to valid enum values
     *
     * @param string|null $status
     * @return string
     */
    private function mapStatus(?string $status): string
    {
        $statusLower = strtolower(trim($status ?? ''));

        $statusMap = [
            'available' => 'available',
            'active'    => 'available',  // Map "active" to "available"
            'reserved'  => 'reserved',
            'hold'      => 'hold',
            'sold'      => 'sold',
        ];

        return $statusMap[$statusLower] ?? 'available';
    }

    /**
     * Validation rules for each row
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'name' => 'nullable', // Allow nullable so empty rows don't fail validation
            // Size can be "25x50" or "1250" - we parse it programmatically
            'size' => 'nullable',
            'sector' => 'nullable',
            'street' => 'nullable', // Can be string "Main St" or number "6"
            'type' => 'nullable',
            'category' => 'nullable',
            // Accept various status formats - will be mapped to correct values
            'status' => 'nullable|in:available,reserved,hold,sold,Available,Reserved,Hold,Sold,active,Active,ACTIVE',
            'actions' => 'nullable',
        ];
    }

    /**
     * Prepare the data for validation
     * This runs BEFORE validation
     */
    public function prepareForValidation($data, $index)
    {
        // If name is empty, we'll skip this row in model() method
        // So don't validate it
        if (empty($data['name']) || trim($data['name']) === '') {
            return [];
        }

        return $data;
    }

    /**
     * Custom validation messages
     *
     * @return array
     */
    public function customValidationMessages(): array
    {
        return [
            'name.required' => 'The Name field is required and cannot be empty.',
            'name.unique' => 'A plot with this name ":input" already exists in the database.',
            'size.numeric' => 'The Size must be a valid number.',
            'size.min' => 'The Size must be at least 0.',
            'status.in' => 'The Status must be one of: available, active, reserved, hold, or sold.',
        ];
    }

    /**
     * Custom validation attributes
     *
     * @return array
     */
    public function customValidationAttributes(): array
    {
        return [
            'name' => 'Plot Name',
            'size' => 'Plot Size',
            'sector' => 'Sector',
            'street' => 'Street',
            'type' => 'Type',
            'category' => 'Category',
            'status' => 'Status',
            'actions' => 'Actions/Description',
        ];
    }
}
