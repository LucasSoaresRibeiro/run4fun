const loadingIcon = document.createElement('div');
loadingIcon.id = 'loading-icon';
loadingIcon.style.display = 'none';
loadingIcon.style.position = 'fixed';
loadingIcon.style.top = '10px';
loadingIcon.style.right = '10px';
loadingIcon.style.width = '30px';
loadingIcon.style.height = '30px';
loadingIcon.style.border = '4px solid #f3f3f3';
loadingIcon.style.borderTop = '4px solid #3498db';
loadingIcon.style.borderRadius = '50%';
loadingIcon.style.animation = 'spin 1s linear infinite';

document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(loadingIcon);
});

function formatCPF(cpf) {
    console.log(cpf);
    if (!cpf) return '';
    const cleanCPF = cpf.toString().replace(/\D/g, '');
    if (cleanCPF.length !== 11) return cpf;
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function renderTableData(data, columns, headerRow, tableBody, searchInput, displayAction) {

    // Create header
    headerRow.innerHTML = columns
        .map(header => `<th>${header}</th>`)
        .join('') + (displayAction ? '<th>Ações</th>' : '');

    // Display all rows without filtering
    tableBody.innerHTML = data
        .map(row => `
            <tr>
                ${columns.map((columnName, colIdx) => {
                    if (columnName == 'CPF') {
                        return `<td>${formatCPF(row[columnName])}</td>`;
                    } else {
                        return `<td>${row[columnName]}</td>`;
                    }
                }).join('')}
                ${displayAction ? `
                    <td><button class="btn-adicionar" style="padding: 6px 12px; background-color: ${row["Inscrição Run4Fun"] ? '#6c757d' : '#aa3365'}; color: white; border: none; border-radius: 4px; cursor: pointer;" ${row["Inscrição Run4Fun"] ? 'disabled' : ''}>${row["Inscrição Run4Fun"] ? 'Inscrito' : 'Inscrever'}</button></td>
                ` : ''}
            </tr>
        `).join('');


        if (displayAction) {

            // Adicionar event listeners para os botões de inscrição
            document.querySelectorAll('.btn-adicionar').forEach((button, index) => {
                button.addEventListener('click', async () => {
                    enrollmentClick(button, data[index]);
                });
            });

        }
}

function _updateCounters(dataConferencistas, dataInscritos, grupos) {

    document.getElementById('conferencistas-count').textContent = `(${dataConferencistas.length})`;
    document.getElementById('incricoes-count').textContent = `(${dataInscritos.length})`;
    document.getElementById('grupos-count').textContent = `(${grupos.length})`;

}

function showLoading() {
    loadingIcon.style.display = 'block';
}

function hideLoading() {
    loadingIcon.style.display = 'none';
}

function createTabEvent() {

    document.querySelectorAll('.tab-button').forEach(button => {

        button.addEventListener('click', () => {

            // Atualizar estado das abas
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Atualizar tab atual e reexibir os dados
            currentTab = button.getAttribute('data-tab');

            document.getElementById('divConferencistas').style.display = 'none';
            document.getElementById('divInscricoes').style.display = 'none';
            document.getElementById('divGrupos').style.display = 'none';
            // document.getElementById('divPlanilha').style.display = 'none';

            if (currentTab === 'conferencistas-list') {

                document.getElementById('divConferencistas').style.display = 'table';

            } else if (currentTab === 'incricoes-list') {

                document.getElementById('divInscricoes').style.display = 'table';

            }  else if (currentTab === 'grupos-list') {

                document.getElementById('divGrupos').style.display = 'table';

            }
            // else if (currentTab === 'planilha-list') {

            //     document.getElementById('divPlanilha').style.display = 'table';

            // }
        });
    });

}

function renderCardData(groupedData, groupDiv) {

    let groupsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';

    Object.keys(groupedData).forEach(groupKey => {
        const participants = groupedData[groupKey];
        groupsHtml += `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #aa3365;">Grupo ${groupKey} (${participants.length} participantes)</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${participants.map(participant => `
                        <li style="padding: 8px 0; border-bottom: 1px solid #eee; background-color: ${participant["Gênero"] === 'Masculino' ? '#e3f2fd' : '#fce4ec'};">
                            ${participant["Nome"]} ${participant["Gênero"] === 'Masculino' ? '♂️' : '♀️'}
                        </li>
                    `).join('')}
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
        existingContainer.remove();
    }

    groupDiv.appendChild(groupsContainer);
}