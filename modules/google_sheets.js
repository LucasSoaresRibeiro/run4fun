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

async function callEnrollmentBKP(row, grupo=0) {

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

    const counterInscricoesBefore = DADOS_INSCRICOES.length;
    let counterInscricoesAfter = counterInscricoesBefore;

    try {
        const response = await fetch(requestUrl, { mode: 'cors', credentials: 'include' })
    } catch (error) {
        
    } finally {

        while (counterInscricoesAfter <= counterInscricoesBefore) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            loadDadosInscricoes();
            counterInscricoesAfter = DADOS_INSCRICOES.length;

            if (counterInscricoesAfter > counterInscricoesBefore) {
                console.log("Inscrição realizada com sucesso!");
                await loadDadosConferencistas();
                updateAllData();
                renderAllData();
                break;
            }
        }
    }

}

async function callEnrollment(button, row, grupo) {

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

    const counterInscricoesBefore = DADOS_INSCRICOES.length;
    let counterInscricoesAfter = counterInscricoesBefore;

    window.open(requestUrl, '_blank', 'width=500,height=500');

    // Show loading icon
    const loadingIcon = document.createElement('div');
    loadingIcon.id = 'loading-icon';
    loadingIcon.style.position = 'fixed';
    loadingIcon.style.top = '10px';
    loadingIcon.style.right = '10px';
    loadingIcon.style.width = '30px';
    loadingIcon.style.height = '30px';
    loadingIcon.style.border = '4px solid #f3f3f3';
    loadingIcon.style.borderTop = '4px solid #3498db';
    loadingIcon.style.borderRadius = '50%';
    loadingIcon.style.animation = 'spin 1s linear infinite';
    document.body.appendChild(loadingIcon);

    while (counterInscricoesAfter <= counterInscricoesBefore) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        loadDadosInscricoes();
        counterInscricoesAfter = DADOS_INSCRICOES.length;

        console.log("counterInscricoesBefore: ", counterInscricoesBefore);
        console.log("counterInscricoesAfter: ", counterInscricoesAfter);

        if (counterInscricoesAfter > counterInscricoesBefore) {
            console.log("Inscrição realizada com sucesso!");

            // Atualiza botão
            button.disabled = false;
            button.style.backgroundColor = '#6c757d';
            button.textContent = 'Inscrito';

            // Carrega todos os dados novamente
            await loadDadosConferencistas();
            updateAllData();
            renderAllData();
            break;
        }
    }

    // Remove loading icon
    if (loadingIcon) {
        document.body.removeChild(loadingIcon);
    }
}

// Add CSS for loading icon animation
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);