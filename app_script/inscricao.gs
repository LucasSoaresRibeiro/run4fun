const SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1qfZmLYsRXiYHMamWLyaDTK1qU28VP4jBCDFlCmeRjDY/edit';
const SHEET_NAME = 'Run4Fun'; // Corrected: Use the variable, not a string literal 'SHEET_NAME'

// Define constraints as constants for clarity and maintainability
const MIN_GROUPS = 5;
const MAX_GROUPS = 10;
const MAX_PER_GROUP = 8;

// Define column indices (0-based) for better readability and maintenance
// Make sure these match your actual sheet structure!
const COL_IDX_NOME = 0;
const COL_IDX_CPF = 1;
const COL_IDX_CELULAR = 2;
const COL_IDX_GENERO = 3;
const COL_IDX_IDADE = 4;
const COL_IDX_GRUPO = 5;
const COL_IDX_TIMESTAMP = 6;


/**
 * Determines the group for a new participant based on availability, capacity, and gender balance.
 *
 * @param {string} _group The requested group number (as a string). "0" indicates automatic assignment.
 * @param {string} newParticipantGender The gender of the new participant ('M', 'F', 'Masculino', 'Feminino', etc.). Needed for balancing.
 * @return {number} The assigned group number.
 * @throws {Error} If all available groups within the limits are full.
 */
function _getGroup(_group = "0", newParticipantGender = "") {

    // Use active spreadsheet if bound, otherwise open by URL
    // const ss = SpreadsheetApp.getActiveSpreadsheet(); // Use if script is bound to the Sheet
    const ss = SpreadsheetApp.openByUrl(SHEET_EDIT_URL); // Use if standalone script
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        throw new Error(`Sheet "${SHEET_NAME}" not found in the spreadsheet.`);
    }
    const dadosIncricoes = sheet.getDataRange().getValues();

    // --- Rule 1: If group different from zero, return the group ---
    let requestedGroup = parseInt(_group, 10);
    if (!isNaN(requestedGroup) && requestedGroup !== 0) {
        // Optional: Add validation to check if requestedGroup is within allowed range (1 to MAX_GROUPS)
        // or if it's already full, depending on desired behavior.
        // For now, strictly follow the rule: return if not zero.
        Logger.log(`Assigning explicitly requested group: ${requestedGroup}`);
        return requestedGroup;
    }

    // --- Rule 2: Group is zero, proceed with automatic assignment ---

    // Normalize new participant's gender for comparison
    const normalizedNewGender = (newParticipantGender || '').trim().toLowerCase();
    const isNewMale = normalizedNewGender === 'm' || normalizedNewGender === 'masculino';
    const isNewFemale = normalizedNewGender === 'f' || normalizedNewGender === 'feminino';
     if (!isNewMale && !isNewFemale) {
        Logger.log(`Warning: Unknown gender '${newParticipantGender}' provided for balancing. Will prioritize group capacity.`);
    }


    // --- Rule 3: Analyze existing participants per group ---
    const groupsInfo = {}; // Stores { groupNumber: { total: count, male: count, female: count } }

    // Start from index 1 to skip header row
    for (let i = 1; i < dadosIncricoes.length; i++) {
        const row = dadosIncricoes[i];
        // Ensure row has enough columns and group is a valid number
        if (row.length > COL_IDX_GRUPO && row[COL_IDX_GRUPO] !== "" && !isNaN(row[COL_IDX_GRUPO])) {
            const groupNumber = parseInt(row[COL_IDX_GRUPO], 10);
            const gender = (row[COL_IDX_GENERO] || '').trim().toLowerCase(); // Normalize gender from sheet

            if (groupNumber > 0) { // Only consider valid group numbers
                 const groupKey = groupNumber.toString();
                 if (!groupsInfo[groupKey]) {
                    groupsInfo[groupKey] = { total: 0, male: 0, female: 0 };
                 }
                 groupsInfo[groupKey].total++;
                 if (gender === 'm' || gender === 'masculino') {
                     groupsInfo[groupKey].male++;
                 } else if (gender === 'f' || gender === 'feminino') {
                     groupsInfo[groupKey].female++;
                 }
                 // Participants with other/blank genders increment total but not M/F counts
            }
        }
    }
    Logger.log("Current Group Analysis: " + JSON.stringify(groupsInfo));


    // --- Rules 4-8: Find or create a suitable group ---
    let bestGroup = -1;
    let minDifference = Infinity;       // Track the smallest gender difference achieved by adding the new person
    let minTotalInBestGroup = Infinity; // Track the total members in the best group found so far (lower is better for tie-breaking)

    // Iterate through potential groups from 1 up to the maximum allowed
    for (let g = 1; g <= MAX_GROUPS; g++) {
        const groupKey = g.toString();
        const currentInfo = groupsInfo[groupKey] || { total: 0, male: 0, female: 0 }; // Default for non-existing groups

        // Check if group is already full
        if (currentInfo.total >= MAX_PER_GROUP) {
            continue; // Skip this group, try the next one
        }

        // Calculate potential state if the new participant joins this group
        const potentialTotal = currentInfo.total + 1;
        let potentialMale = currentInfo.male;
        let potentialFemale = currentInfo.female;
        let potentialDifference;

        // Calculate potential gender difference only if gender is known
        if (isNewMale) {
            potentialMale++;
            potentialDifference = Math.abs(potentialMale - potentialFemale);
        } else if (isNewFemale) {
            potentialFemale++;
            potentialDifference = Math.abs(potentialMale - potentialFemale);
        } else {
            // Gender unknown, cannot use balance metric effectively.
            // Set difference high to prioritize balanced groups if available,
            // but allow assignment based on capacity if no balanced option exists.
             potentialDifference = Infinity;
        }

        // --- Decision Logic: Find the best group ---
        // Priority 1: Better gender balance (lower difference)
        // Priority 2: If balance is equal, choose the group with fewer members currently
        // Priority 3: If gender is unknown, prioritize the group with fewest members.

        let assignToThisGroup = false;

        if (bestGroup === -1) {
            // First non-full group found is automatically the best so far
            assignToThisGroup = true;
        } else if (isNewMale || isNewFemale) {
            // Use balance metric if gender is known
            if (potentialDifference < minDifference) {
                assignToThisGroup = true; // Better balance
            } else if (potentialDifference === minDifference && potentialTotal < minTotalInBestGroup) {
                assignToThisGroup = true; // Same balance, but less full
            }
        } else {
             // Gender is unknown, prioritize lowest occupancy
             if (potentialTotal < minTotalInBestGroup) {
                 assignToThisGroup = true;
             }
        }


        if (assignToThisGroup) {
            bestGroup = g;
            minDifference = potentialDifference;
            minTotalInBestGroup = potentialTotal; // This is potential total AFTER adding
        }

    } // End loop through potential groups

    // --- Rule 9: Return assigned group or handle error ---
    if (bestGroup !== -1) {
         // Even if MIN_GROUPS isn't met yet, assign to the best available spot found.
         // The logic naturally tries groups 1, 2, 3... first.
        Logger.log(`Assigning Group: ${bestGroup}. Potential Balance Diff: ${minDifference === Infinity ? 'N/A' : minDifference}, Potential Total: ${minTotalInBestGroup}`);
        return bestGroup;
    } else {
        // This means all groups from 1 to MAX_GROUPS are full
        Logger.log(`Error: All groups (1 to ${MAX_GROUPS}) are full. Max participants per group: ${MAX_PER_GROUP}.`);
        throw new Error(`All ${MAX_GROUPS} groups are currently full. Cannot register at this time.`);
    }
}

// Modified doGet to pass gender to _getGroup
function doGet(e) {

    // Validate essential parameters
    if (!e || !e.parameter || !e.parameter.nome || !e.parameter.cpf || !e.parameter.genero) {
         Logger.log('Error: Missing required parameters in request.');
         return ContentService.createTextOutput(JSON.stringify({
            'status': 'error',
            'message': 'Missing required parameters (nome, cpf, genero are mandatory).'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    try {
        // Use active spreadsheet if bound, otherwise open by URL
        // const ss = SpreadsheetApp.getActiveSpreadsheet(); // Use if script is bound
        const ss = SpreadsheetApp.openByUrl(SHEET_EDIT_URL); // Use if standalone
        const sheet = ss.getSheetByName(SHEET_NAME);
         if (!sheet) {
            throw new Error(`Sheet "${SHEET_NAME}" not found.`);
        }

        const nome = e.parameter.nome;
        const cpf = "" + e.parameter.cpf; // Ensure string
        const celular = e.parameter.celular || ""; // Optional
        const genero = e.parameter.genero;
        const idade = e.parameter.idade || ""; // Optional
        const requestedGroup = e.parameter.grupo || "0"; // Default to "0" for auto-assign

        Logger.log(`Processing data for ${nome}`);
        Logger.log(`Requested group: ${requestedGroup}, Gender: ${genero}`);

        // Call _getGroup, passing the requested group AND the new participant's gender
        const assignedGroup = _getGroup(requestedGroup, genero);
        Logger.log(`Assigned group: ${assignedGroup}`);

        // Add new row with the assigned group
        sheet.appendRow([
            nome,
            cpf,
            celular,
            genero, // Store original gender provided
            idade,
            assignedGroup, // Use the determined group
            new Date()
        ]);

        // Log success
        Logger.log(`Data added successfully for ${nome}, Group ${assignedGroup}`);

        // Create HTML response
        const response = HtmlService.createHtmlOutput(`
            <!DOCTYPE html>
            <html lang='pt-BR'> <!-- Adjusted language -->
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'>
                    <title>Run4Fun - Inscrição Confirmada</title> <!-- Adjusted title -->
                    <script>
                        function closeWindow() {
                            // Try closing the window/tab; might be blocked by browser depending on context
                            window.close();
                            // Fallback or alternative for mobile/web apps might be needed
                            // e.g., redirecting to a 'success' page or showing a persistent message.
                            // For simple web forms, this often works if opened via target="_blank" or window.open().
                            // If it doesn't close, provide clear instructions.
                            if (!window.closed) {
                                alert("Inscrição concluída! Você pode fechar esta janela manualmente.");
                            }
                        }
                    </script>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; color: #333; text-align: center; }
                        .container { max-width: 600px; margin: 40px auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                        h1 { color: #0056b3; margin-bottom: 10px; } /* Example color */
                        h2 { color: #333; margin-top: 0; margin-bottom: 20px; font-size: 1.8em; }
                        h3 { color: #4CAF50; margin-bottom: 30px; } /* Success color */
                        .group-number { font-size: 3em; color: #d9534f; font-weight: bold; margin: 10px 0; } /* Highlight group */
                        .close-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; cursor: pointer; }
                        .close-link:hover { background-color: #0056b3; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <h1>Run4Fun</h1>
                        <h3>Inscrição realizada com sucesso!</h3>
                        <h2>${nome}</h2> <!-- Display name -->
                        Grupo atribuído: <!-- Label -->
                        <div class='group-number'>${assignedGroup}</div> <!-- Display assigned group -->
                        <br>
                        <a href='javascript:closeWindow();' class='close-link'>Fechar Janela</a>
                    </div>
                </body>
            </html>
            `);

        return response;

    } catch (error) {
        // Log the detailed error
        Logger.log(`Error processing request: ${error.message}\nStack: ${error.stack || 'No stack available'}`);
        Logger.log(`Request Parameters: ${JSON.stringify(e ? e.parameter : 'N/A')}`);


        // Return a user-friendly error response (HTML or JSON)
        // HTML Error Response:
         return HtmlService.createHtmlOutput(`
            <!DOCTYPE html>
            <html lang='pt-BR'>
                <head><meta charset='UTF-8'><title>Erro na Inscrição</title></head>
                <body style='font-family: Arial, sans-serif; text-align: center; padding: 40px;'>
                    <h1>Run4Fun</h1>
                    <h2>Ocorreu um erro ao processar sua inscrição.</h2>
                    <p style='color: red;'>Detalhe: ${error.message}</p> <!-- Show error message -->
                    <p>Por favor, tente novamente mais tarde ou entre em contato com o organizador.</p>
                </body>
            </html>`);

        /* // JSON Error Response (alternative):
        return ContentService.createTextOutput(JSON.stringify({
            'status': 'error',
            'message': `Erro ao processar inscrição: ${error.message}` // Provide clearer error
        })).setMimeType(ContentService.MimeType.JSON);
        */
    }
}