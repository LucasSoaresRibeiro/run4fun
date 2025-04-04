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


        const inscrito = DADOS_INSCRICOES.find(inscricao =>  conferencista['Nº Inscrição'] === inscricao['Nº Inscrição']);

        if (inscrito) {
            conferencista['Nome'] = inscrito['Nome'];
            conferencista['CPF'] = inscrito['CPF'];
            conferencista['Celular'] = inscrito['Celular'];
            conferencista['Gênero'] = inscrito['Gênero'];
            conferencista['Idade'] = inscrito['Idade'];
            conferencista['Inscrição Run4Fun'] = true;

        } else {

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

    const columns = ['Nº Inscrição', 'Nome', 'CPF', 'Celular', 'Gênero', 'Idade'];
    const displayAction = true;

    renderTableData(DADOS_CONFERENCISTAS, columns, headerRowConferencistas, tableBodyConferencistas, searchInputConferencistas, displayAction);

}

function _renderDataInscricoes() {

    const headerRowInscricoes = document.getElementById('headerRowInscricoes');
    const tableBodyInscricoes = document.getElementById('tableBodyInscricoes');
    const searchInputInscricoes = document.getElementById('searchInputInscricoes');

    const columns = ['Nº Inscrição', 'Nome', 'CPF', 'Celular', 'Gênero', 'Idade', 'Grupo'];
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
        // Get existing elements from the HTML
        const overlay = document.getElementById('overlay');
        const dialog = document.getElementById('dialog');
        const input = document.getElementById('groupInput');
        const cancelButton = document.getElementById('cancelButton');
        const confirmButton = document.getElementById('confirmButton');
        const errorElement = document.getElementById('error');

        console.log(row);

        // Load data into dialog elements
        document.getElementById('nome').value = row['Nome'];
        // Apply CPF mask when setting the value
        const cpfValue = row['CPF'].replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        document.getElementById('cpf').value = cpfValue;
        document.getElementById('celular').value = row['Celular'];
        document.getElementById('genero').value = row['Gênero'];
        document.getElementById('idade').value = row['Idade'];

        // Show the dialog
        dialog.style.display = 'block';
        overlay.style.display = 'block';

        // Cancel button event
        cancelButton.onclick = () => {
            dialog.style.display = 'none';
            overlay.style.display = 'none';
        };

        // Confirm button event
        confirmButton.onclick = () => {

            // Disable the button during submission
            button.disabled = true;
            button.style.backgroundColor = '#6c757d';
            button.textContent = 'Enviando...';

            // get updated values from form
            const grupo = input.value.trim();
            const data = {
                inscricao: row['Nº Inscrição'],
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value,
                celular: document.getElementById('celular').value,
                genero: document.getElementById('genero').value,
                idade: document.getElementById('idade').value,
                grupo: grupo ? grupo : 0,
            }
            callEnrollment(button, data);

            // Hide the dialog after confirmation
            dialog.style.display = 'none';
            overlay.style.display = 'none';
        };
    } catch (error) {
        console.error('Erro ao enviar dados:', error);

        // Display the error message
        const errorElement = document.getElementById('error');
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

document.getElementById('enrollmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const celular = document.getElementById('celular').value;
    const genero = document.getElementById('genero').value;
    const idade = document.getElementById('idade').value; 
    const grupos = document.getElementById('groupInput').value;

    if (!nome || !cpf || !celular || !genero || !idade || grupos) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }

    // Format data for sending to backend
    const formData = {
        nome,
        cpf: cpf.replace(/\D/g, ''), // Remove non-digits
        celular: celular.replace(/\D/g, ''), // Remove non-digits
        genero,
        idade: parseInt(idade),
        grupos
    };

    console.log('Dados da inscrição:', formData);
    // Here you would typically send the data to your backend
    $('#enrollmentModal').modal('hide');
    document.getElementById('enrollmentForm').reset();
});

// Add CPF mask
document.getElementById('cpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        e.target.value = value;
    }
});

// Add phone mask
document.getElementById('celular').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        e.target.value = value;
    }
});