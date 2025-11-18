# Google Sheets Auto-Sync Setup Guide

This guide will help you set up automatic synchronization between your Google Sheets and the TajMap database.

## Prerequisites

- Google Cloud Platform account
- Your Google Sheets document with plot data
- TajMap Laravel application

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "TajMap Sync")
4. Click "Create"

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter service account details:
   - Name: `tajmap-sheets-sync`
   - Description: `Service account for TajMap Google Sheets synchronization`
4. Click "Create and Continue"
5. Skip optional steps and click "Done"

## Step 4: Generate JSON Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - a JSON file will be downloaded
6. Rename the downloaded file to `google-credentials.json`
7. Move it to `storage/app/google-credentials.json` in your Laravel project

## Step 5: Share Google Sheet with Service Account

1. Open the downloaded JSON file
2. Copy the `client_email` value (looks like: `tajmap-sheets-sync@project-id.iam.gserviceaccount.com`)
3. Open your Google Sheets document
4. Click "Share" button
5. Paste the service account email
6. Give it "Viewer" permission (read-only)
7. Uncheck "Notify people"
8. Click "Share"

## Step 6: Get Spreadsheet ID

From your Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/1CyG8Wi9D_Vt4Z8nss9fe5onbDb6A3PC7/edit
```

The Spreadsheet ID is: `1CyG8Wi9D_Vt4Z8nss9fe5onbDb6A3PC7`

## Step 7: Configure Environment Variables

Add these to your `.env` file:

```env
# Google Sheets Sync Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=1CyG8Wi9D_Vt4Z8nss9fe5onbDb6A3PC7
GOOGLE_SHEETS_RANGE=Sheet1!A2:Z
GOOGLE_SHEETS_SYNC_ENABLED=true
GOOGLE_SHEETS_SYNC_INTERVAL=60
```

**Configuration explained:**
- `GOOGLE_SHEETS_SPREADSHEET_ID`: Your spreadsheet ID from URL
- `GOOGLE_SHEETS_RANGE`: The range to read (A2:Z means row 2 onwards, all columns)
- `GOOGLE_SHEETS_SYNC_ENABLED`: Enable/disable automatic sync
- `GOOGLE_SHEETS_SYNC_INTERVAL`: How often to sync (in minutes)

## Step 8: Set Up Scheduled Task

### For Windows (Laragon/XAMPP)

1. Open Windows Task Scheduler
2. Create a new task:
   - **Name**: TajMap Google Sheets Sync
   - **Trigger**: Every 60 minutes (or your preferred interval)
   - **Action**: Start a program
   - **Program**: `C:\laragon\bin\php\php-8.2.x\php.exe` (adjust path for your PHP version)
   - **Arguments**: `artisan sheets:sync`
   - **Start in**: `C:\laragon\www\TajMap`

### For Linux/Mac

Add to crontab (`crontab -e`):

```bash
# Sync Google Sheets every hour
0 * * * * cd /path/to/TajMap && php artisan sheets:sync >> /dev/null 2>&1
```

### Laravel Scheduler Method (Recommended)

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    if (config('services.google_sheets.sync_enabled')) {
        $interval = config('services.google_sheets.sync_interval', 60);
        $schedule->command('sheets:sync')
            ->everyMinutes($interval)
            ->withoutOverlapping()
            ->onOneServer();
    }
}
```

Then ensure Laravel's scheduler is running:
```bash
php artisan schedule:work
```

## Step 9: Test Manual Sync

Run the sync command manually to test:

```bash
php artisan sheets:sync
```

You should see output like:
```
Starting Google Sheets sync...
Spreadsheet ID: 1CyG8Wi9D_Vt4Z8nss9fe5onbDb6A3PC7
Range: Sheet1!A2:Z

Sync completed successfully!
+----------------------+-------+
| Metric               | Count |
+----------------------+-------+
| Total rows processed | 150   |
| New plots added      | 0     |
| Plots updated        | 150   |
| Errors               | 0     |
+----------------------+-------+
```

## Expected Sheet Format

Your Google Sheet should have these columns (row 1 should be headers):

| Name   | Size  | Sector  | Street | Type        | Category | Status    | Actions     |
|--------|-------|---------|--------|-------------|----------|-----------|-------------|
| P-001  | 25x50 | A       | 1      | Residential | Premium  | available | Prime plot  |
| P-002  | 1250  | B       | 2      | Commercial  | Standard | sold      | Corner plot |

**Column Mappings:**
1. **Name** → plot_number (required)
2. **Size** → area (can be "25x50" or "1250")
3. **Sector** → sector
4. **Street** → street
5. **Type** → type
6. **Category** → category
7. **Status** → status (available/reserved/hold/sold)
8. **Actions** → description

## Troubleshooting

### Error: "Credentials file not found"
- Ensure `google-credentials.json` is in `storage/app/` directory
- Check file permissions

### Error: "The caller does not have permission"
- Make sure you shared the sheet with the service account email
- Verify the service account has at least "Viewer" permission

### Error: "Spreadsheet ID not found"
- Double-check your spreadsheet ID in `.env`
- Ensure the sheet is not deleted or moved

### No data syncing
- Check that your sheet has data starting from row 2
- Verify the range in `GOOGLE_SHEETS_RANGE` matches your sheet structure
- Run manual sync with `php artisan sheets:sync` to see detailed errors

## Monitoring

Check sync logs in `storage/logs/laravel.log`:

```bash
tail -f storage/logs/laravel.log | grep "Google Sheets"
```

## Security Notes

- **Never commit** `google-credentials.json` to version control
- Add to `.gitignore`:
  ```
  storage/app/google-credentials.json
  ```
- Use read-only (Viewer) permissions for the service account
- Rotate credentials periodically
- Consider using environment-specific service accounts for production

## How It Works

1. **Scheduled Task** triggers every X minutes (based on `GOOGLE_SHEETS_SYNC_INTERVAL`)
2. **Service fetches data** from Google Sheets using the API
3. **For each row**:
   - If plot exists (matching `plot_number`): **Update** the record
   - If plot doesn't exist: **Create** new record
4. **Coordinates are preserved** - sync only updates plot details, not map coordinates
5. **Logs are created** for monitoring and debugging

## Manual Sync Options

### Sync specific sheet and range:
```bash
php artisan sheets:sync --spreadsheet-id=YOUR_ID --range="Sheet1!A2:I100"
```

### Sync using .env defaults:
```bash
php artisan sheets:sync
```

## Need Help?

- Check Laravel logs: `storage/logs/laravel.log`
- Run manual sync to see detailed output
- Verify Google Cloud Console for API quotas and errors
- Ensure service account has proper permissions
