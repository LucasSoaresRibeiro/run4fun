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

    // Replace this URL with your Google Sheets published CSV URL
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEETS_URL}/pub?output=csv`;

    async function fetchData() {
        try {
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';

            const response = await fetch(SHEET_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const csvText = await response.text();
            const data = parseCSV(csvText);
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
        const desiredColumns = ['Nome', 'Celular', 'Gênero'];

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
            .map(row => `
                <tr>
                    ${columnIndexes.map(index => `<td>${index !== -1 ? row[index] : ''}</td>`).join('')}
                    <td><button class="btn-adicionar" style="padding: 6px 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Inscrever</button></td>
                </tr>
            `)
            .join('');

        // Adicionar event listeners para os botões de inscrição
        document.querySelectorAll('.btn-adicionar').forEach((button, index) => {
            button.addEventListener('click', async () => {
                try {
                    const row = rows[index];
                    const userData = {
                        nome: row[columnIndexes[0]],
                        celular: row[columnIndexes[1]],
                        genero: row[columnIndexes[2]]
                    };

                    // URL da API do Google Apps Script
                    const SCRIPT_URL = `https://script.google.com/macros/s/${GOOGLE_APPS_SCRIPT_ID}/exec`;

                    // Desabilitar o botão durante o envio
                    button.disabled = true;
                    button.style.backgroundColor = '#6c757d';
                    button.textContent = 'Enviando...';

                    // const response = await fetch(SCRIPT_URL, {
                    //     redirect: "follow",
                    //     method: 'GET',
                    //     body: JSON.stringify(userData),
                    //     headers: {
                    //         // 'Content-Type': 'application/json'
                    //       "Content-Type": "text/plain;charset=utf-8",
                    //     }
                    // });

                    // const response = await fetch(SCRIPT_URL, {
                    //     method: 'POST',
                    //     body: JSON.stringify(userData),
                    //     headers: {
                    //         'Content-Type': 'text/plain;charset=utf-8',
                    //     }
                    // });

                    const TEST_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLgDjxs80pQ8T-ur6l_NbVHpREjbKX07P01V993T3qNemeTv8map09sLrdO0tP6mxPG7H1mHGcvROMFG7nGxAiO1p-LD7oqFYUlJaN7ewsXGtp0hUSqA37n3KLiHGLhDPPdkHQHG6-XXYAx5emcW_1aHAkoQOo9IMbALzEjWqEA_01j2GcJq0q62UXVJ8sslcJYuXhWP_seDT7YwL9pQZFJ0haBZNRb45i7QaXMnF4UUj8jrB-8e17spjZotLZ4NI7Vp32pVltmbub_mhSNgbPC6zyIBZQ&lib=MDlE1B_PPcUf1_Pygm9BMxtf9UcAuUuPd';
                    const response = await fetch(TEST_URL);

                    if (!response.ok) {
                        throw new Error('Falha ao enviar dados');
                    }

                    // Atualizar o botão após sucesso
                    button.style.backgroundColor = '#198754';
                    button.textContent = 'Inscrito!';
                    button.disabled = true;

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