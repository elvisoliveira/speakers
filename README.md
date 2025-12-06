# Weekend Meeting Schedule Manager

A web application for managing and displaying weekend meeting schedules with support for multiple languages and easy JSON-based data management.

## Features

- **Print-Ready**: Clean print layout with automatic formatting
- **Google Sheets Integration**: Export data directly from Google Sheets using included AppScript

## How It Works

### 1. Data Input
You can input meeting schedule data in two ways:

**Option A: Paste JSON directly**
- Paste your JSON data in the left textarea
- The preview updates automatically

**Option B: Export from Google Sheets**
- Use the included `appscript.js` in your Google Sheet
- Export as JSON with one click
- Copy and paste into the app

### 2. Data Structure

```json
[
    {
        "date": "2025/11/01",
        "speaker": "John Doe",
        "location": "City Name",
        "congregation": "Congregation Name",
        "outline": 4,
        "obs": "Talk theme or notes",
        "chairman": "Chairman Name",
        "reader": "Reader Name",
        "attendant1": "Attendant 1 Name",
        "attendant2": "Attendant 2 Name"
    }
]
```

**Field Reference:**
- `date`: Meeting date (YYYY/MM/DD format)
- `speaker`: Speaker's name
- `location`: City or location
- `congregation`: Congregation name
- `outline`: Talk outline number (optional)
- `obs`: Talk theme or observation notes
- `chairman`: Meeting chairman
- `reader`: Watchtower reader
- `attendant1`: First attendant
- `attendant2`: Second attendant
- `type`: Special event type (optional)
  - `"A"` = Circuit Assembly
  - `"C"` = Regional Convention
  - `"E"` = Special Talk
  - `"Z"` = Zoom meeting (shows icon)
- `interpreter`: Interpreter name (optional)

## Google Sheets Integration

### Setup
1. Open your Google Sheet with meeting data
2. Go to Extensions → Apps Script
3. Paste the contents of `appscript.js`
4. Save and refresh your spreadsheet
5. Use the "Export JSON" menu to export data

### Export Options
- **Export JSON for this sheet**: Exports active sheet only
- **Export JSON for selected rows**: Exports only selected rows
- **Export JSON for all sheets**: Exports all sheets

The exported JSON is ready to paste directly into the application.

## Technology Stack

- **Alpine.js**: Lightweight reactive framework (15KB)
- **Vanilla JavaScript**: No build tools required
- **CSS Grid/Flexbox**: Modern responsive layout
- **Google Apps Script**: Spreadsheet integration
