function _parseJson(tsv) {

    var lines = tsv.split("\n");
    var result = [];
    var headers=lines[0].split("\t");
  
    for(var i=1;i<lines.length;i++){
  
        var obj = {};
        var currentline=lines[i].split("\t");
  
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
  
        result.push(obj);
    }
  
    return result;
}

async function googleSheetsLoadData(googleSheetId, sheetId) {

    const sheetUrl = `https://docs.google.com/spreadsheets/d/e/${googleSheetId}/pub?gid=${sheetId}&single=true&output=tsv`;
    const response = await fetch(`${sheetUrl}&cacheBuster=${Date.now()}`);
    if (!response.ok) {
        throw new Error('Falha ao ler dados da planilha');
    }
    const csvText = await response.text();
    const data = _parseJson(csvText);
    return data;

}

async function callEnrollment(row, grupo=0) {

    // URL da API do Google Apps Script
    const SCRIPT_URL = `https://script.google.com/macros/s/${GOOGLE_APPS_SCRIPT_ID}/exec`;

    // Construct URL with parameters
    const params = new URLSearchParams({
        nome: row['Nome'],
        cpf: row['CPF'],
        celular: row['Celular'],
        genero: row['Gênero'],
        idade: row['Idade'],
        grupo: grupo,
    });
    const requestUrl = `${SCRIPT_URL}?${params.toString()}`;

    // Use fetch with cors mode and include credentials

    try {
        const response = await fetch(requestUrl, { mode: 'cors', credentials: 'include' })
        // .then(response => {
        //     if (!response.ok) {
        //         throw new Error('Failed to send request');
        //     }
        //     return response.text();
        // })
        // .then(data => console.log('Response:', data))
        // .catch(err => console.error('Error sending request:', err));
    } catch (error) {
        
    } finally {
        setTimeout(() => {
            loadData();
        }, 10000);
    }



}