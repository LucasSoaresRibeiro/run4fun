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
    let currentTab = 'complete-list'; // Store current active tab

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
                throw new Error('Falha ao ler dados da planilha');
            }
            const csvText = await response.text();
            const data = parseCSV(csvText);

            // Buscar dados da aba Run4Fun
            const run4funResponse = await fetch(RUN4FUN_SHEET_URL+"&"+(new Date().getTime()));
            if (!run4funResponse.ok) {
                throw new Error('Falha ao ler dados das inscrições na planilha');
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
            const searchTerm = normalizeText(searchInput.value.toLowerCase());
            const filteredRows = allRows.filter(row => 
                columnIndexes.some(index => 
                    index !== -1 && row[index] && normalizeText(row[index].toLowerCase()).includes(searchTerm)
                )
            );

            // Função para normalizar texto (remover acentos e caracteres especiais)
            function normalizeText(text) {
                return text.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                    .replace(/[^a-zA-Z0-9\s]/g, ''); // Remove caracteres especiais
            }
            displayFilteredRows(filteredRows);
        });
    }

    function updateCounters(totalRows, run4funRows) {
        document.getElementById('complete-count').textContent = `(${totalRows})`;
        document.getElementById('run4fun-count').textContent = `(${run4funRows})`;
        document.getElementById('groups-count').textContent = `(${run4funRows})`;
    }

    function displayFilteredRows(rows) {
        // Mostrar/ocultar elementos baseado na aba atual
        const groupsInput = document.getElementById('groups-input');
        groupsInput.style.display = currentTab === 'groups-list' ? 'block' : 'none';
        searchInput.style.display = currentTab === 'groups-list' ? 'none' : 'block';

        // Atualizar contadores
        const totalRows = rows.filter(x => x[columnIndexes[1]]).length;
        const run4funRows = rows.filter(x => x[columnIndexes[1]] && inscritosRun4Fun.includes(parseInt(x[columnIndexes[1]], 10))).length;
        updateCounters(totalRows, run4funRows);

        // Filtrar rows baseado na aba atual
        let filteredRows;
        if (currentTab === 'run4fun-list') {
            filteredRows = rows.filter(row => inscritosRun4Fun.includes(parseInt(row[columnIndexes[1]], 10)));
        } else if (currentTab === 'groups-list') {
            filteredRows = rows.filter(row => inscritosRun4Fun.includes(parseInt(row[columnIndexes[1]], 10)));
            const numGroups = parseInt(document.getElementById('numGroups').value, 10);
            const groups = distributeIntoGroups(filteredRows, numGroups);
            displayGroups(groups);
            return;
        } else {
            filteredRows = rows;
        }

        tableBody.innerHTML = filteredRows
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

                        inscritosRun4Fun.push(parseInt(userData.cpf, 10)); // Add to the list of subscribed CPFs with correct format
                        displayFilteredRows(allRows); // Update the display to reflect changes
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

    function createTableHeader(headers) {
        const headerRow = document.getElementById('headerRow');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
    }

    function addTableRow(rowData, headers) {
        const tbody = document.getElementById('tableBody');
        const tr = document.createElement('tr');
        
        rowData.forEach((cell, index) => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.setAttribute('data-label', headers[index]);
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    }
    function distributeIntoGroups(rows, numGroups) {
        // Separate participants by gender
        const males = rows.filter(row => row[columnIndexes[3]] === 'Masculino');
        const females = rows.filter(row => row[columnIndexes[3]] === 'Feminino');
        
        // Calculate ideal number of males per group
        const malesPerGroup = Math.floor(males.length / numGroups);
        const extraMales = males.length % numGroups;
        
        // Shuffle arrays
        const shuffledMales = [...males].sort(() => Math.random() - 0.5);
        const shuffledFemales = [...females].sort(() => Math.random() - 0.5);
        
        // Initialize groups
        const groups = Array.from({ length: numGroups }, () => []);
        
        // Distribute males evenly
        let maleIndex = 0;
        for (let i = 0; i < numGroups; i++) {
            const numMalesForThisGroup = i < extraMales ? malesPerGroup + 1 : malesPerGroup;
            for (let j = 0; j < numMalesForThisGroup; j++) {
                if (maleIndex < shuffledMales.length) {
                    groups[i].push(shuffledMales[maleIndex]);
                    maleIndex++;
                }
            }
        }
        
        // Distribute females
        shuffledFemales.forEach((female, index) => {
            groups[index % numGroups].push(female);
        });
        
        return groups;
    }

    function displayGroups(groups) {
        const table = document.getElementById('dataTable');
        table.style.display = 'none';

        let groupsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
        groups.forEach((group, index) => {
            groupsHtml += `
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin-top: 0; color: #007bff;">Grupo ${index + 1}</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${group.map(row => `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${row[columnIndexes[0]]} ${row[columnIndexes[3]] === 'Masculino' ? '♂️' : '♀️'}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
        groupsHtml += '</div>';

        const groupsContainer = document.createElement('div');
        groupsContainer.id = 'groupsContainer';
        groupsContainer.innerHTML = groupsHtml;

        const existingContainer = document.getElementById('groupsContainer');
        if (existingContainer) {
            existingContainer.replaceWith(groupsContainer);
        } else {
            table.parentNode.insertBefore(groupsContainer, table);
        }
    }

    // Adicionar event listeners para as abas e input de grupos
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Atualizar estado das abas
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Atualizar tab atual e reexibir os dados
            currentTab = button.getAttribute('data-tab');
            const table = document.getElementById('dataTable');
            table.style.display = currentTab === 'groups-list' ? 'none' : 'table';
            
            const groupsContainer = document.getElementById('groupsContainer');
            if (groupsContainer) {
                groupsContainer.style.display = currentTab === 'groups-list' ? 'block' : 'none';
            }
            
            displayFilteredRows(allRows);
        });
    });

    document.getElementById('numGroups').addEventListener('change', () => {
        if (currentTab === 'groups-list') {
            displayFilteredRows(allRows);
        }
    });

    // Initial data fetch
    fetchData();
});