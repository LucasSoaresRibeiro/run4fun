// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const GOOGLE_SHEETS_URL = urlParams.get('sheetsUrl');
const GOOGLE_APPS_SCRIPT_ID = urlParams.get('scriptId');

// GLOBAL VARIABLES
let PARTICIPANTES_CONFERENCIA = [];
let PARTICIPANTES_RUN4FUN = [];

// Função para verificar se um CPF está inscrito no Run4Fun
function isInscrito(cpf) {
    if (!cpf || PARTICIPANTES_RUN4FUN.length <= 1) return false;
    const cpfIndex = PARTICIPANTES_RUN4FUN[0].findIndex(header => header === 'CPF');
    if (cpfIndex === -1) return false;
    return PARTICIPANTES_RUN4FUN.slice(1).some(row => parseInt(row[cpfIndex], 10) === parseInt(cpf, 10));
}

document.addEventListener('DOMContentLoaded', () => {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const headerRowConferencia = document.getElementById('headerRowConferencia');
    const tableBodyConferencia = document.getElementById('tableBodyConferencia');
    const searchInputConferencia = document.getElementById('searchInputConferencia');
    const headerRowRun4Fun = document.getElementById('headerRowRun4Fun');
    const tableBodyRun4Fun = document.getElementById('tableBodyRun4Fun');
    const searchInputRun4Fun = document.getElementById('searchInputRun4Fun');
    let columnIndexes = []; // Store column indexes for filtering

    let allRows = []; // Store all rows for filtering
    let currentTab = 'complete-list'; // Store current active tab

    // URLs das abas da planilha
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pub?output=csv`;
    const RUN4FUN_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pub?gid=1812350065&output=csv`;
    const CONFIGURATION_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pub?gid=254684756&single=true&output=csv`;
    // let inscritosRun4Fun = [];

    async function fetchData() {
        try {
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';

            // Buscar dados da primeira aba
            const response = await fetch(SHEET_URL);
            if (!response.ok) {
                throw new Error('Falha ao ler dados da planilha');
            }
            const csvText = await response.text();
            PARTICIPANTES_CONFERENCIA = parseCSV(csvText);

            // Buscar dados da aba Run4Fun
            const run4funResponse = await fetch(RUN4FUN_SHEET_URL+"&"+(new Date().getTime()));
            if (!run4funResponse.ok) {
                throw new Error('Falha ao ler dados das inscrições na planilha');
            }
            const run4funCsvText = await run4funResponse.text();
            PARTICIPANTES_RUN4FUN = parseCSV(run4funCsvText);
                        
            displayDataConferencia();
            displayDataRun4Fun();

        } catch (error) {
            console.error('Error:', error);
            errorElement.textContent = `Error: ${error.message}`;
            errorElement.style.display = 'block';
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        return lines.map(line => {
            // Handle cases where fields might contain commas within quotes
            const matches = line.match(/(\".+?\"|[^",]+)(?=\s*,|\s*$)/g) || [];
            return matches.map(field => field.replace(/\"/g, '').trim());
        }).filter(row => row.length > 0); // Remove empty rows
    }

    function displayDataConferencia() {

        // Define columns configuration for each tab 
        const desiredColumns = ['Nome', 'CPF', 'Celular', 'Gênero', 'Idade'];
        const headers = PARTICIPANTES_CONFERENCIA[0];
        columnIndexes = desiredColumns.map(col => headers.findIndex(header => header === col));

        // Create header based on current tab
        headerRowConferencia.innerHTML = desiredColumns
            .map(header => `<th>${header}</th>`)
            .join('') + '<th>Ações</th>';

        // Get appropriate rows based on current tab
        const rows = PARTICIPANTES_CONFERENCIA.slice(1);

        allRows = rows;
        displayFilteredRowsConferencia(rows);

        // Add search functionality
        searchInputConferencia.addEventListener('input', () => {
            const searchTerm = normalizeText(searchInputConferencia.value.toLowerCase());
            const filteredRows = allRows.filter(row => 
                columnIndexes.some(index => 
                    index !== -1 && row[index] && normalizeText(row[index].toLowerCase()).includes(searchTerm)
                )
            );

            function normalizeText(text) {
                return text.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9\s]/g, '');
            }
            displayFilteredRowsConferencia(filteredRows);
        });
    }

    function displayDataRun4Fun() {

        // Define columns configuration for each tab 
        const desiredColumns = ['Nome', 'CPF', 'Telefone', 'Gênero', 'Idade', 'Grupo', 'Data Incrição'];
        const headers = PARTICIPANTES_RUN4FUN[0];
        columnIndexes = desiredColumns.map(col => headers.findIndex(header => header === col));

        // Create header based on current tab
        headerRowRun4Fun.innerHTML = desiredColumns
            .map(header => `<th>${header}</th>`)
            .join('');

        // Get appropriate rows based on current tab
        const rows = PARTICIPANTES_RUN4FUN.slice(1);

        allRows = rows;
        displayFilteredRowsRun4Fun(rows);

        // Add search functionality
        searchInputRun4Fun.addEventListener('input', () => {
            const searchTerm = normalizeText(searchInputRun4Fun.value.toLowerCase());
            const filteredRows = allRows.filter(row => 
                columnIndexes.some(index => 
                    index !== -1 && row[index] && normalizeText(row[index].toLowerCase()).includes(searchTerm)
                )
            );

            function normalizeText(text) {
                return text.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9\s]/g, '');
            }
            displayFilteredRowsRun4Fun(filteredRows);
        });
    }

    function updateCounters(totalRows, run4funRows) {
        document.getElementById('complete-count').textContent = `(${totalRows})`;
        document.getElementById('run4fun-count').textContent = `(${run4funRows})`;
        document.getElementById('groups-count').textContent = `(${run4funRows})`;
    }

    function displayFilteredRowsConferencia(rows) {
        
        // Mostrar/ocultar elementos baseado na aba atual
        searchInputConferencia.style.display = currentTab === 'groups-list' ? 'none' : 'block';

        // Atualizar contadores
        const totalRows = PARTICIPANTES_CONFERENCIA.length;
        const run4funRows = PARTICIPANTES_RUN4FUN.length;
        updateCounters(totalRows, run4funRows);

        // Filtrar rows baseado na aba atual
        let filteredRows = rows;

        tableBodyConferencia.innerHTML = filteredRows
            .map(row => {
                    return `
                        <tr>
                            ${columnIndexes.map((index, colIdx) => {
                                if (colIdx === 4 && index !== -1) { // Data de Nascimento column
                                    if (!row[index]) return '<td>-</td>';
                                    const birthDate = row[index].split('/');
                                    if (birthDate.length !== 3) return '<td>-</td>';
                                    const birth = new Date(birthDate[2], birthDate[1] - 1, birthDate[0]);
                                    if (isNaN(birth.getTime())) return '<td>-</td>';
                                    const today = new Date();
                                    let age = today.getFullYear() - birth.getFullYear();
                                    const monthDiff = today.getMonth() - birth.getMonth();
                                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                        age--;
                                    }
                                    return `<td>${age} anos</td>`;
                                }
                                return `<td>${index !== -1 ? row[index] : ''}</td>`;
                            }).join('')}
                            <td><button class="btn-adicionar" style="padding: 6px 12px; background-color: ${isInscrito(row[columnIndexes[1]]) ? '#6c757d' : '#28a745'}; color: white; border: none; border-radius: 4px; cursor: pointer;" ${isInscrito(row[columnIndexes[1]]) ? 'disabled' : ''}>${isInscrito(row[columnIndexes[1]]) ? 'Inscrito' : 'Inscrever'}</button></td>
                        </tr>
                    `;
                }
            )
            .join('');

        // Adicionar event listeners para os botões de inscrição
        document.querySelectorAll('.btn-adicionar').forEach((button, index) => {
            button.addEventListener('click', async () => {
                try {
                    const row = rows[index];
                    const cpf = row[columnIndexes[1]];
                    
                    // Verificar se já está inscrito
                    if (isInscrito(cpf)) {
                        button.style.backgroundColor = '#6c757d';
                        button.textContent = 'Inscrito';
                        button.disabled = true;
                        return;
                    }

                    const userData = {
                        nome: row[columnIndexes[0]],
                        cpf: row[columnIndexes[1]],
                        celular: row[columnIndexes[2]],
                        genero: row[columnIndexes[3]],
                    };

                    // URL da API do Google Apps Script
                    const SCRIPT_URL = `https://script.google.com/macros/s/${GOOGLE_APPS_SCRIPT_ID}/exec`;

                    // Desabilitar o botão durante o envio
                    button.disabled = true;
                    button.style.backgroundColor = '#6c757d';
                    button.textContent = 'Enviando...';

                    // Construct URL with parameters
                    const params = new URLSearchParams({
                        nome: userData.nome,
                        cpf: userData.cpf,
                        celular: userData.celular,
                        genero: userData.genero,
                    });
                    const requestUrl = `${SCRIPT_URL}?${params.toString()}`;
                    open(requestUrl, '_blank'); // Open in a new tab or window

                    // Atualizar o botão após sucesso
                    setTimeout(() => {
                        button.style.backgroundColor = '#6c757d';
                        button.textContent = 'Inscrito';
                        button.disabled = true;

                        // Atualizar PARTICIPANTES_RUN4FUN com o novo inscrito
                        const headers = PARTICIPANTES_RUN4FUN[0];
                        const newRow = headers.map(header => {
                            switch(header) {
                                case 'Nome': return userData.nome;
                                case 'CPF': return userData.cpf;
                                case 'Telefone': return userData.celular;
                                case 'Gênero': return userData.genero;
                                case 'Grupo': return userData.grupo;
                                case 'Data Inscrição': return new Date().toLocaleDateString();
                                default: return '';
                            }
                        });
                        PARTICIPANTES_RUN4FUN.push(newRow);
                        displayFilteredRowsConferencia(allRows); // Update the display to reflect changes
                    }, 2000); // Wait for 2 seconds before enabling the button

                } catch (error) {
                    console.error('Erro ao enviar dados:', error);
                    errorElement.textContent = `Erro ao enviar dados: ${error.message}`;
                    errorElement.style.display = 'block';

                    // Restaurar o botão em caso de erro
                    button.disabled = false;
                    button.style.backgroundColor = '#28a745';
                    button.textContent = 'Inscrever';
                }
            });
        });
    }

    // Adicionar event listeners para as abas e input de grupos
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Atualizar estado das abas
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Atualizar tab atual e reexibir os dados
            currentTab = button.getAttribute('data-tab');

            document.getElementById('dataTableConferencia').style.display = 'none';
            document.getElementById('dataTableRun4Fun').style.display = 'none';
            document.getElementById('searchInputConferencia').style.display = 'none';
            document.getElementById('searchInputRun4Fun').style.display = 'none';

            if (currentTab === 'complete-list') {
                document.getElementById('dataTableConferencia').style.display = 'table';
                document.getElementById('searchInputConferencia').style.display = 'block';
                displayFilteredRowsConferencia(allRows);
            } else if (currentTab === 'run4fun-list') {
                document.getElementById('dataTableRun4Fun').style.display = 'table';
                document.getElementById('searchInputRun4Fun').style.display = 'block'; 
                // displayFilteredRowsRun4Fun(allRows);
            } else {
                // document.getElementById('groupsContainer').style.display = 'block';
                // displayFilteredRowsConferencia(allRows);
            }

        });
    });

    document.getElementById('numGroups').addEventListener('change', () => {
        if (currentTab === 'groups-list') {
            displayFilteredRowsConferencia(allRows);
        }
    });

    // Initial data fetch
    fetchData();
});