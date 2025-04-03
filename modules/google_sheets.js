// function _parseCSV(csvText) {
//     const lines = csvText.split('\n');
//     return lines.map(line => {
//         // Handle cases where fields might contain commas within quotes
//         const matches = line.match(/(\".+?\"|[^",]+)(?=\s*,|\s*$)/g) || [];
//         return matches.map(field => field.replace(/\"/g, '').trim());
//     }).filter(row => row.length > 0); // Remove empty rows
// }

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
    const response = await fetch(sheetUrl);
    if (!response.ok) {
        throw new Error('Falha ao ler dados da planilha');
    }
    const csvText = await response.text();
    const data = _parseJson(csvText);
    return data;

}