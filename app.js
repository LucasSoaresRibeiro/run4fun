// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const GOOGLE_SHEETS_URL = urlParams.get('sheetsUrl');
const GOOGLE_APPS_SCRIPT_ID = urlParams.get('scriptId');

// GLOBAL VARIABLES
let DADOS_CONFERENCISTAS = [];
let DADOS_INSCRICOES = [];
let DADOS_GRUPOS = [];
let DADOS_CONFIGURACAO = [];

document.addEventListener('DOMContentLoaded', () => {

    async function main() {

        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';
        const errorElement = document.getElementById('error');

        try {

            // Carrega dados da planilha
            DADOS_CONFIGURACAO = await googleSheetsLoadData(GOOGLE_SHEETS_URL, '254684756');
            DADOS_CONFERENCISTAS = await googleSheetsLoadData(GOOGLE_SHEETS_URL, '1587534397');
            DADOS_INSCRICOES = await googleSheetsLoadData(GOOGLE_SHEETS_URL, '1812350065');

            createTabEvent();
            updateAllData();
            renderDataConferencistas();
            renderDataInscricoes();
            renderDataGrupos();

        } catch (error) {

            console.error('Error:', error);
            errorElement.textContent = `Error: ${error.message}`;
            errorElement.style.display = 'block';

        } finally {

            loadingElement.style.display = 'none';

        }

    }

    main();

});

function updateAllData() {

    _updateDataConferencistas();
    _updateDataGrupos();
    _updateCounters(DADOS_CONFERENCISTAS, DADOS_INSCRICOES, Object.keys(DADOS_GRUPOS));

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

function renderDataConferencistas() {

    const headerRowConferencistas = document.getElementById('headerRowConferencistas');
    const tableBodyConferencistas = document.getElementById('tableBodyConferencistas');
    const searchInputConferencistas = document.getElementById('searchInputConferencistas');

    const columns = ['Nome', 'CPF', 'Celular', 'Gênero', 'Idade'];
    const displayAction = true;

    renderTableData(DADOS_CONFERENCISTAS, columns, headerRowConferencistas, tableBodyConferencistas, searchInputConferencistas, displayAction);

}

function renderDataInscricoes() {

    const headerRowInscricoes = document.getElementById('headerRowInscricoes');
    const tableBodyInscricoes = document.getElementById('tableBodyInscricoes');
    const searchInputInscricoes = document.getElementById('searchInputInscricoes');

    const columns = ['Nome', 'CPF', 'Celular', 'Gênero', 'Idade', 'Grupo'];
    const displayAction = false;

    renderTableData(DADOS_INSCRICOES, columns, headerRowInscricoes, tableBodyInscricoes, searchInputInscricoes, displayAction);

}

function renderDataGrupos() {

    const divGrupos = document.getElementById('divGrupos');
    renderCardData(DADOS_GRUPOS, divGrupos);

}