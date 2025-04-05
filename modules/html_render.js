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
                        return `<td><span class="small-header">${columnName}</span>${formatCPF(row[columnName])}</td>`;
                    } else {
                        return `<td><span class="small-header">${columnName}</span>${row[columnName]}</td>`;
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

    let groupsHtml = '<div class="groups-grid">';

    Object.keys(groupedData).forEach(groupKey => {
        const participants = groupedData[groupKey];
        groupsHtml += `
            <div class="group-card">
                <div class="group-header">
                    <h3>${groupKey}</h3>
                    <span>${participants.length} 🧑🏻</span>
                </div>
                <ul class="group-participants">
                    ${participants.map(participant => `
                        <li class="group-participant ${participant["Gênero"] === 'Masculino' ? 'group-participant-male' : 'group-participant-female'}">
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