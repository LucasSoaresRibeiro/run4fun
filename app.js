document.addEventListener('DOMContentLoaded', () => {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const headerRow = document.getElementById('headerRow');
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    let columnIndexes = []; // Store column indexes for filtering

    let allRows = []; // Store all rows for filtering

    // Replace this URL with your Google Sheets published CSV URL
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfXtNmJv-qOLs7kJRNPPWMxwjt4BT0DUwRG8Oy3lQCK98-Ao61lsXEklC6Y235Nw/pub?output=csv';

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
            .join('');

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
                </tr>
            `)
            .join('');
    }

    // Initial data fetch
    fetchData();
});