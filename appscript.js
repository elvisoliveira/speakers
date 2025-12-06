// Export Google Sheets as JSON with various formatting options
// Supports exporting single sheet or all sheets with customizable output format

// Export format options
const FORMAT_ONELINE = 'One-line';
const FORMAT_MULTILINE = 'Multi-line';
const FORMAT_PRETTY = 'Pretty';

// Language syntax options
const LANGUAGE_JS = 'JavaScript';
const LANGUAGE_PYTHON = 'Python';

// Data structure options
const STRUCTURE_LIST = 'List';
const STRUCTURE_HASH = 'Hash (keyed by "id" column)';

// Defaults for this particular spreadsheet, change as desired
const DEFAULT_FORMAT = FORMAT_PRETTY;
const DEFAULT_LANGUAGE = LANGUAGE_JS;
const DEFAULT_STRUCTURE = STRUCTURE_LIST;

// Creates custom menu when spreadsheet opens
function onOpen() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const menuEntries = [
        { name: "Export JSON for this sheet", functionName: "exportSheet" },
        { name: "Export JSON for selected rows", functionName: "exportSelectedRows" },
        { name: "Export JSON for all sheets", functionName: "exportAllSheets" }
    ];
    ss.addMenu("Export JSON", menuEntries);
}

// Export all sheets in the spreadsheet to JSON
function exportAllSheets(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const options = getExportOptions(e);

    // Convert each sheet to JSON and store in object keyed by sheet name
    const sheetsData = {};
    sheets.forEach(sheet => {
        const rowsData = convertSheetToObjects(sheet, options);
        sheetsData[sheet.getName()] = rowsData;
    });

    const json = formatAsJSON(sheetsData, options);
    displayJSONDialog(json);
}

// Export currently active sheet to JSON
function exportSheet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const options = getExportOptions(e);

    const rowsData = convertSheetToObjects(sheet, options);
    const json = formatAsJSON(rowsData, options);
    displayJSONDialog(json);
}

// Export selected rows from active sheet to JSON
function exportSelectedRows(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const selection = sheet.getActiveRange();
    const options = getExportOptions(e);

    // Check if user has made a selection
    if (!selection) {
        SpreadsheetApp.getUi().alert('Please select rows to export');
        return;
    }

    const rowsData = convertSelectionToObjects(sheet, selection, options);
    const json = formatAsJSON(rowsData, options);
    displayJSONDialog(json);
}

// Get export options from event parameters or use defaults
// Caches user preferences for next use
function getExportOptions(e) {
    const params = e?.parameter || {};

    const options = {
        language: params.language || DEFAULT_LANGUAGE,
        format: params.format || DEFAULT_FORMAT,
        structure: params.structure || DEFAULT_STRUCTURE
    };

    // Cache user preferences
    const cache = CacheService.getPublicCache();
    cache.put('language', options.language);
    cache.put('format', options.format);
    cache.put('structure', options.structure);

    Logger.log(options);
    return options;
}

// Convert object to JSON string with specified formatting
function formatAsJSON(object, options) {
    let jsonString;

    // Apply formatting style
    if (options.format === FORMAT_PRETTY) {
        jsonString = JSON.stringify(object, null, 4);
    } else if (options.format === FORMAT_MULTILINE) {
        jsonString = Utilities.jsonStringify(object);
        jsonString = jsonString.replace(/},/g, '},\n');
        jsonString = jsonString.replace(/":\[{"/g, '":\n[{"');
        jsonString = jsonString.replace(/}\],/g, '}],\n');
    } else {
        jsonString = Utilities.jsonStringify(object);
    }

    // Apply language-specific syntax
    if (options.language === LANGUAGE_PYTHON) {
        jsonString = jsonString.replace(/"([a-zA-Z]*)":\s+"/g, '"$1": u"');
    }

    return jsonString;
}

// Display JSON text in a modal dialog
function displayJSONDialog(text) {
    const output = HtmlService.createHtmlOutput(
        `<textarea style='width:100%;' rows='20'>${text}</textarea>`
    );
    output.setWidth(400);
    output.setHeight(300);
    SpreadsheetApp.getUi().showModalDialog(output, 'Exported JSON');
}

// Convert sheet data to array of objects (or hash if specified)
// Uses frozen rows as headers and remaining rows as data
function convertSheetToObjects(sheet, options) {
    // Get headers from frozen rows
    const headersRange = sheet.getRange(1, 1, sheet.getFrozenRows(), sheet.getMaxColumns());
    const headers = headersRange.getValues()[0];

    // Get data rows (everything after frozen rows)
    const dataRange = sheet.getRange(
        sheet.getFrozenRows() + 1,
        1,
        sheet.getMaxRows(),
        sheet.getMaxColumns()
    );

    const objects = convertRowsToObjects(dataRange.getValues(), normalizeHeaders(headers));

    // Return as hash (keyed by id) or list
    if (options.structure === STRUCTURE_HASH) {
        const objectsById = {};
        objects.forEach(object => {
            objectsById[object.id] = object;
        });
        return objectsById;
    }

    return objects;
}

// Convert selected range to array of objects (or hash if specified)
// Uses frozen rows as headers and selected rows as data
function convertSelectionToObjects(sheet, selection, options) {
    // Get headers from frozen rows
    const headersRange = sheet.getRange(1, 1, sheet.getFrozenRows(), sheet.getMaxColumns());
    const headers = headersRange.getValues()[0];

    // Get selected data values
    const selectedData = selection.getValues();

    const objects = convertRowsToObjects(selectedData, normalizeHeaders(headers));

    // Return as hash (keyed by id) or list
    if (options.structure === STRUCTURE_HASH) {
        const objectsById = {};
        objects.forEach(object => {
            objectsById[object.id] = object;
        });
        return objectsById;
    }

    return objects;
}

// Convert 2D array of rows into array of objects
// Each row becomes an object with properties defined by keys
function convertRowsToObjects(data, keys) {
    const objects = [];

    data.forEach(row => {
        const object = {};
        let hasData = false;

        row.forEach((cellData, j) => {
            if (!isCellEmpty(cellData)) {
                object[keys[j]] = cellData;
                hasData = true;
            }
        });

        // Only include rows that have at least one non-empty cell
        if (hasData) {
            objects.push(object);
        }
    });

    return objects;
}

// Convert array of header strings to valid JavaScript property names
function normalizeHeaders(headers) {
    return headers
        .map(header => normalizeHeader(header))
        .filter(key => key.length > 0);
}

// Convert a header string to a valid JavaScript property name
// Removes special characters, converts to camelCase
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions)" -> "marketCapMillions"
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
    let key = "";
    let upperCase = false;

    for (let i = 0; i < header.length; i++) {
        const letter = header[i];

        if (letter === " " && key.length > 0) {
            upperCase = true;
            continue;
        }

        // Skip non-alphanumeric characters
        if (!/[a-zA-Z0-9]/.test(letter)) {
            continue;
        }

        // Skip leading digits (property names must start with a letter)
        if (key.length === 0 && /\d/.test(letter)) {
            continue;
        }

        if (upperCase) {
            upperCase = false;
            key += letter.toUpperCase();
        } else {
            key += letter.toLowerCase();
        }
    }

    return key;
}

// Check if a cell contains an empty string
function isCellEmpty(cellData) {
    return typeof cellData === "string" && cellData === "";
}
