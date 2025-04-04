// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const GOOGLE_SHEETS_URL = urlParams.get('sheetsUrl');
const GOOGLE_APPS_SCRIPT_ID = urlParams.get('scriptId');

// GLOBAL VARIABLES
let DADOS_CONFERENCISTAS = [];
let DADOS_INSCRICOES = [];
let DADOS_GRUPOS = [];

document.addEventListener('DOMContentLoaded', () => {

    createTabEvent();
    loadData();

});

async function loadData() {

    showLoading();

    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
    const errorElement = document.getElementById('error');

    try {

        // Carrega dados da planilha
        await loadDadosConferencistas();
        await loadDadosInscricoes();

        updateAllData();
        renderAllData();

    } catch (error) {

        console.error('Error:', error);
        errorElement.textContent = `Error: ${error.message}`;
        errorElement.style.display = 'block';

    } finally {

        loadingElement.style.display = 'none';
        hideLoading();

    }

}

async function loadDadosConferencistas() {
    DADOS_CONFERENCISTAS = await googleSheetsLoadData(GOOGLE_SHEETS_URL, '1587534397');
}

async function loadDadosInscricoes() {
    DADOS_INSCRICOES = await googleSheetsLoadData(GOOGLE_SHEETS_URL, '1812350065');
}

function updateAllData() {

    _updateDataConferencistas();
    _updateDataGrupos();
    _updateCounters(DADOS_CONFERENCISTAS, DADOS_INSCRICOES, Object.keys(DADOS_GRUPOS));

}

function renderAllData() {
    
    _renderDataConferencistas();
    _renderDataInscricoes();
    _renderDataGrupos();
    // _renderIframe();
}

function _updateDataConferencistas() {

    DADOS_CONFERENCISTAS.forEach(conferencista => {

        // Incrições
        conferencista["Inscrição Run4Fun"] = DADOS_INSCRICOES.some(inscricao => {
            return conferencista.CPF === inscricao.CPF;
        });

        // Idade
        if (conferencista['Data de Nascimento']) {
            const dataNascimento = conferencista['Data de Nascimento'].split('/');
            if (dataNascimento.length === 3) {
                const nascimento = new Date(dataNascimento[2], dataNascimento[1] - 1, dataNascimento[0]);
                if (!isNaN(nascimento.getTime())) {
                    const hoje = new Date();
                    let idade = hoje.getFullYear() - nascimento.getFullYear();
                    const mesDiff = hoje.getMonth() - nascimento.getMonth();
                    if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
                        idade--;
                    }
                    conferencista["Idade"] = idade;
                }
            }
        }
    });
}

function _updateDataGrupos() {

    DADOS_GRUPOS = DADOS_INSCRICOES.reduce((acc, inscricao) => {
        const grupo = inscricao.Grupo || 'Sem Grupo';
        if (!acc[grupo]) {
            acc[grupo] = [];
        }
        acc[grupo].push(inscricao);
        return acc;
    }, {});

}

function _renderDataConferencistas() {

    const headerRowConferencistas = document.getElementById('headerRowConferencistas');
    const tableBodyConferencistas = document.getElementById('tableBodyConferencistas');
    const searchInputConferencistas = document.getElementById('searchInputConferencistas');

    const columns = ['Nome', 'CPF', 'Celular', 'Gênero', 'Idade'];
    const displayAction = true;

    renderTableData(DADOS_CONFERENCISTAS, columns, headerRowConferencistas, tableBodyConferencistas, searchInputConferencistas, displayAction);

}

function _renderDataInscricoes() {

    const headerRowInscricoes = document.getElementById('headerRowInscricoes');
    const tableBodyInscricoes = document.getElementById('tableBodyInscricoes');
    const searchInputInscricoes = document.getElementById('searchInputInscricoes');

    const columns = ['Nome', 'CPF', 'Celular', 'Gênero', 'Idade', 'Grupo'];
    const displayAction = false;

    renderTableData(DADOS_INSCRICOES, columns, headerRowInscricoes, tableBodyInscricoes, searchInputInscricoes, displayAction);

}

function _renderDataGrupos() {

    const divGrupos = document.getElementById('divGrupos');
    renderCardData(DADOS_GRUPOS, divGrupos);

}

function _renderIframe() {

    const iframeDiv = document.getElementById('divPlanilha');
    const url = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pubhtml?gid=1812350065&amp;single=true&amp;widget=true&amp;headers=false`;

    // create iframe
    const iframe = document.createElement('iframe')
    iframe.setAttribute('src', url);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '600px');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('allow', 'encrypted-media');

    iframeDiv.appendChild(iframe);

}

function enrollmentClick(button, row) {

    try {
        // Create dialog elements
        const dialog = document.createElement('div');
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = '#fff';
        dialog.style.padding = '20px';
        dialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        dialog.style.zIndex = '1000';

        const label = document.createElement('label');
        label.textContent = 'Grupo:';
        label.style.display = 'block';
        label.style.marginBottom = '10px';

        const input = document.createElement('input');
        input.type = 'text';
        input.style.width = '100%';
        input.style.marginBottom = '10px';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.style.backgroundColor = '#dc3545';
        cancelButton.style.color = '#fff';
        cancelButton.style.border = 'none';
        cancelButton.style.padding = '10px';
        cancelButton.style.cursor = 'pointer';

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirmar';
        confirmButton.style.backgroundColor = '#28a745';
        confirmButton.style.color = '#fff';
        confirmButton.style.border = 'none';
        confirmButton.style.padding = '10px';
        confirmButton.style.cursor = 'pointer';

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);

        dialog.appendChild(label);
        dialog.appendChild(input);
        dialog.appendChild(buttonContainer);
        document.body.appendChild(dialog);

        // Cancel button event
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        // Confirm button event
        confirmButton.addEventListener('click', () => {
            const grupo = input.value.trim();
            if (grupo) {
                // Disable the button during submission
                button.disabled = true;
                button.style.backgroundColor = '#6c757d';
                button.textContent = 'Enviando...';

                callEnrollment(button, row, grupo);
            } else {
                callEnrollment(button, row, 0);
            }
            // Remove dialog after confirmation
            document.body.removeChild(dialog);
        });

    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        errorElement.textContent = `Erro ao enviar dados: ${error.message}`;
        errorElement.style.display = 'block';

        // Restore the button in case of an error
        button.disabled = false;
        button.style.backgroundColor = '#28a745';
        button.textContent = 'Inscrever';
    }
}

function searchConferencistas() {

    const input = document.getElementById('searchInputConferencistas');
    const table = document.getElementById('dataTableConferencistas');
    search(input, table);

}

function searchInscricoes() {

    const input = document.getElementById('searchInputInscricoes');
    const table = document.getElementById('dataTableInscricoes');
    search(input, table);

}

function search(input, table) {

    const filter = input.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Normalize and remove accents
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) { // Skip header row
        const cells = rows[i].getElementsByTagName('td');
        let match = false;

        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Normalize and remove accents
            if (cellText.includes(filter)) {
                match = true;
                break;
            }
        }

        rows[i].style.display = match ? '' : 'none';
    }

}