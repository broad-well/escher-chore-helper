const backingSpreadsheet = SpreadsheetApp.openById('1iRXUrvjwOtfgECtObHC7i50w3KsCvgnTqko9FSXIhzM');

function doGet() {
    return HtmlService.createHtmlOutputFromFile('Index');
}

function listChores(suite: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: Chores`);
    if (sheet == null) throw new Error('Missing suite chore list in spreadsheet');
    return sheet.getDataRange().getValues().map(row => row[0]);
}

function beginChore(user: string, suite: string, chore: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    sheet.appendRow([
        chore, new Date(), null, user
    ]);
}

// TODO if expanding to other suites, supply the suite as well to prevent clashes in initials between suites to cause ambiguity
function checkInitials(initials: string): string|null {
    const listSheet = backingSpreadsheet.getSheetByName('Suitemates');
    if (listSheet == null) throw new Error('Missing suitemates sheet in spreadsheet');
    for (let row = 2; row < 1000; ++row) {
        const storedInitials = listSheet.getRange(row, 1).getValue();
        if (storedInitials == '' || storedInitials == null) break;
        if (storedInitials === initials) return listSheet.getRange(row, 2).getValue();
    }
    return null;
}

function listChoreTasks(chore: string) {
    const sheet = backingSpreadsheet.getSheetByName('Chore Descriptions');
    if (sheet == null) throw new Error('Missing suite chore descriptions in spreadsheet');
    const headerRow = sheet.getRange('1:1').getValues();
    
    const column = headerRow[0].indexOf(chore);
    if (column == null) throw new Error(`No chore description for ${chore}`);
    
    let row = 2, task = null;
    const tasks: string[] = [];
    while ((task = sheet.getRange(row++, column + 1).getValue()?.toString())?.length > 0) {
        tasks.push(task);
    }

    return tasks;
}

function findOngoingChore(user: string, suite: string) {
    const choreRow = findOngoingChoreAndRow(user, suite);
    return choreRow[0];
}

function finishOngoingChore(user: string, suite: string, chore: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    const headers = sheet.getRange('1:1').getValues();

    const row = findOngoingChoreAndRow(user, suite, chore)[1];
    if (row !== null) {
        sheet.getRange(row + 1, headers[0].indexOf('Time finished') + 1).setValue(new Date());
    } else {
        throw new Error('Ongoing chore not found');
    }
}

function cancelOngoingChore(user: string, suite: string, chore: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    const row = findOngoingChoreAndRow(user, suite, chore)[1];
    if (row !== null) {
        sheet.deleteRow(row + 1);
    }
}

function findOngoingChoreAndRow(user: string, suite: string, chore?: string) {
    const valueExists = (v: any) => v?.toString()?.length > 0;
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    const fullValues = sheet.getDataRange().getValues();
    for (let row = 1; row < fullValues.length; ++row) {
        const rowItem = (header: string) => fullValues[row][fullValues[0].indexOf(header)];

        if (!valueExists(rowItem('Time finished')) &&
            valueExists(rowItem('Chore')) &&
            (!chore || rowItem('Chore') == chore) &&
            rowItem('Completed by') == user)
            return [rowItem('Chore'), row];
    }
    return [null, null];
}