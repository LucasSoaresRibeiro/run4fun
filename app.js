// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const GOOGLE_SHEETS_URL = urlParams.get('sheetsUrl');
const GOOGLE_APPS_SCRIPT_ID = urlParams.get('scriptId');

document.addEventListener('DOMContentLoaded', () => {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const headerRow = document.getElementById('headerRow');
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    let columnIndexes = []; // Store column indexes for filtering

    let allRows = []; // Store all rows for filtering

    // URLs das abas da planilha
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pub?output=csv`;
    const RUN4FUN_SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pub?gid=1812350065&output=csv`;
    let inscritosRun4Fun = [];

    async function fetchData() {
        try {
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';

            // Buscar dados da primeira aba
            const response = await fetch(SHEET_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const csvText = await response.text();
            const data = parseCSV(csvText);

            // Buscar dados da aba Run4Fun
            const run4funResponse = await fetch(RUN4FUN_SHEET_URL+"&"+(new Date().getTime()));
            if (!run4funResponse.ok) {
                throw new Error('Failed to fetch Run4Fun data');
            }
            const run4funCsvText = await run4funResponse.text();
            const run4funData = parseCSV(run4funCsvText);
            
            // Armazenar CPF dos inscritos
            if (run4funData.length > 1) {
                const cpfIndex = run4funData[0].findIndex(header => header === 'CPF');
                inscritosRun4Fun = run4funData.slice(1).map(row => parseInt(row[cpfIndex], 10));
            }

            displayData(data);
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

    function displayData(data) {
        if (!data || data.length === 0) {
            throw new Error('No data available');
        }

        // Define as colunas desejadas
        // const desiredColumns = ['Nome', 'E-mail', 'Celular', 'Gênero'];
        const desiredColumns = ['Nome', 'CPF', 'Celular', 'Gênero'];

        // Obter os índices das colunas desejadas
        const headers = data[0];
        columnIndexes = desiredColumns.map(col => headers.findIndex(header => header === col));

        // Criar cabeçalho apenas com as colunas desejadas
        headerRow.innerHTML = desiredColumns
            .map(header => `<th>${header}</th>`)
            .join('') + '<th>Ações</th>';

        // Criar linhas da tabela apenas com as colunas desejadas
        const rows = data.slice(1); // Pular linha do cabeçalho
        allRows = rows; // Store all rows for filtering
        displayFilteredRows(rows);

        // Add event listener for search input
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredRows = allRows.filter(row => 
                columnIndexes.some(index => 
                    index !== -1 && row[index] && row[index].toLowerCase().includes(searchTerm)
                )
            );
            displayFilteredRows(filteredRows);
        });
    }

    function displayFilteredRows(rows) {

        tableBody.innerHTML = rows
            .filter(x => x[columnIndexes[1]]).map(row => `
                <tr>
                    ${columnIndexes.map(index => `<td>${index !== -1 ? row[index] : ''}</td>`).join('')}
                    <td><button class="btn-adicionar" style="padding: 6px 12px; background-color: ${inscritosRun4Fun.includes(parseInt(row[columnIndexes[1]], 10)) ? '#6c757d' : '#28a745'}; color: white; border: none; border-radius: 4px; cursor: pointer;" ${inscritosRun4Fun.includes(parseInt(row[columnIndexes[1]], 10)) ? 'disabled' : ''}>${inscritosRun4Fun.includes(parseInt(row[columnIndexes[1]], 10)) ? 'Inscrito' : 'Inscrever'}</button></td>
                </tr>
            `)
            .join('');

        // Adicionar event listeners para os botões de inscrição
        document.querySelectorAll('.btn-adicionar').forEach((button, index) => {
            button.addEventListener('click', async () => {
                try {
                    const row = rows[index];
                    const cpf = row[columnIndexes[1]];
                    
                    // Verificar se já está inscrito
                    if (inscritosRun4Fun.includes(cpf)) {
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

    // Initial data fetch
    fetchData();
});