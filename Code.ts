const backingSpreadsheet = SpreadsheetApp.openById('1iRXUrvjwOtfgECtObHC7i50w3KsCvgnTqko9FSXIhzM');

function doGet() {
    return HtmlService.createHtmlOutputFromFile('Index');
}

function listChores(suite: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: Chores`);
    if (sheet == null) throw new Error('Missing suite chore list in spreadsheet');
    return sheet.getDataRange().getValues().map(row => row[0]);
}

function beginChore(suite: string, chore: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    sheet.appendRow([
        chore, new Date(), null, Session.getActiveUser().getEmail()
    ]);
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

function findOngoingChore(suite: string) {
    const choreRow = findOngoingChoreAndRow(suite);
    return choreRow[0];
}

function finishOngoingChore(suite: string, chore: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    const headers = sheet.getRange('1:1').getValues();

    const row = findOngoingChoreAndRow(suite, chore)[1];
    if (row !== null) {
        sheet.getRange(row + 1, headers[0].indexOf('Time finished') + 1).setValue(new Date());
    } else {
        throw new Error('Ongoing chore not found');
    }
}

function cancelOngoingChore(suite: string, chore: string) {
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    const row = findOngoingChoreAndRow(suite, chore)[1];
    if (row !== null) {
        sheet.deleteRow(row + 1);
    }
}

function findOngoingChoreAndRow(suite: string, chore?: string) {
    const valueExists = (v: any) => v?.toString()?.length > 0;
    const sheet = backingSpreadsheet.getSheetByName(`${suite}: History`);
    if (sheet == null) throw new Error('Missing suite chore history in spreadsheet');
    const fullValues = sheet.getDataRange().getValues();
    for (let row = 1; row < fullValues.length; ++row) {
        if (!valueExists(fullValues[row][fullValues[0].indexOf('Time finished')]) &&
            valueExists(fullValues[row][fullValues[0].indexOf('Chore')]) &&
            (!chore || fullValues[row][fullValues[0].indexOf('Chore')] == chore) &&
            fullValues[row][fullValues[0].indexOf('Completed by')] == Session.getActiveUser().getEmail())
            return [fullValues[row][fullValues[0].indexOf('Chore')], row];
    }
    return [null, null];
}