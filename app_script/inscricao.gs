const SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1qfZmLYsRXiYHMamWLyaDTK1qU28VP4jBCDFlCmeRjDY/edit';
const SHEET_NAME = 'Run4Fun';

function _getGroup(_group="0") {
    const sheet = SpreadsheetApp.openByUrl(SHEET_EDIT_URL).getSheetByName('SHEET_NAME');
    const dadosIncricoes = sheet.getDataRange().getValues();

    // Implementar regra de preenchimento do grupo:
    // - Se grupo diferente de zero, retorna o grupo
    // - Se grupo igual a zero, prossegue com as regras abaixo
    // - Verifica nos dadosInscricoes a coluna grupo e conta quantos participantes já estão inscritos por grupo
    // - Quantidade mínima de grupos: 5
    // - Quantidade máxima de grupos: 10
    // - Quantidade máxima de participantes por grupo: 8
    // - Tenta equilibrar homens e mulheres em cada grupo, se possível
    // - Se não houver grupos disponíveis, cria um novo grupo
    // - Retorna o número do grupo atribuído

    group = parseInt(_group, 10); // Convert to integer

    if (group !== 0) {
        return group; // Return the provided group if it's not zero
    }

    const groupCounts = {};
    const groupGenderBalance = {};

    // Initialize group counts and gender balance
    for (let i = 1; i < dadosIncricoes.length; i++) {
        const currentGroup = dadosIncricoes[i][5]; // Assuming column 6 is the group
        const gender = dadosIncricoes[i][3]; // Assuming column 4 is the gender

        if (!groupCounts[currentGroup]) {
            groupCounts[currentGroup] = 0;
            groupGenderBalance[currentGroup] = { M: 0, F: 0 };
        }

        groupCounts[currentGroup]++;
        groupGenderBalance[currentGroup][gender]++;
    }

    // Find a suitable group
    for (let i = 1; i <= 10; i++) {
        if (!groupCounts[i]) {
            groupCounts[i] = 0;
            groupGenderBalance[i] = { M: 0, F: 0 };
        }

        if (groupCounts[i] < 8) {
            // Try to balance genders
            const maleCount = groupGenderBalance[i].M;
            const femaleCount = groupGenderBalance[i].F;

            if (maleCount <= femaleCount) {
                groupGenderBalance[i].M++;
            } else {
                groupGenderBalance[i].F++;
            }

            groupCounts[i]++;
            return i; // Return the group number
        }
    }

    // If no group is available, create a new one
    const newGroup = Object.keys(groupCounts).length + 1;
    if (newGroup <= 10) {
        groupCounts[newGroup] = 1;
        groupGenderBalance[newGroup] = { M: 0, F: 0 };
        return newGroup;
    }

    // If maximum groups reached, add balancing to existing groups
    let leastPopulatedGroup = null;
    let minParticipants = Infinity;

    for (const [group, count] of Object.entries(groupCounts)) {
        if (count < minParticipants) {
            minParticipants = count;
            leastPopulatedGroup = parseInt(group, 10);
        }
    }

    if (leastPopulatedGroup !== null) {
        const maleCount = groupGenderBalance[leastPopulatedGroup].M;
        const femaleCount = groupGenderBalance[leastPopulatedGroup].F;

        if (maleCount <= femaleCount) {
            groupGenderBalance[leastPopulatedGroup].M++;
        } else {
            groupGenderBalance[leastPopulatedGroup].F++;
        }

        groupCounts[leastPopulatedGroup]++;
        return leastPopulatedGroup;
    }

    throw new Error('Unable to assign a group due to capacity constraints');
}

function doGet(e) {

    try {
        const sheet = SpreadsheetApp.openByUrl(SHEET_EDIT_URL).getSheetByName('SHEET_NAME');

        Logger.log('Processando dados de '+ e.parameter.nome);
        Logger.log('Grupo recebido: ' + e.parameter.grupo);
        const group = _getGroup(e.parameter.grupo)
        Logger.log('Grupo atribuído: ' + group);

        // Adicionar nova linha com os dados
        sheet.appendRow([
            e.parameter.nome,
            "" + e.parameter.cpf,
            e.parameter.celular,
            e.parameter.genero,
            e.parameter.idade,
            group,
            new Date()
        ]);

        e.parameter.grupoAtribuido = group;

        // Registrar log de sucesso
        Logger.log('Dados adicionados com sucesso: ' + JSON.stringify(e.parameter));

        const response = HtmlService.createHtmlOutput(`
            <!DOCTYPE html>
            <html lang='en'>

                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'>
                    <title>Run4Fun</title>

                    <script language='javascript' type='text/javascript'>
                        function closeWindow() {
                            top.close();
                        }
                    </script>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            background-color: #f5f5f5;
                        }
                        .container {
                            max-width: 1200px;
                            margin: 0 auto;
                            background-color: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            margin-bottom: 30px;
                        }
                        h1, h2, h3, h4 {
                            text-align: center;
                        }
                    </style>
                </head>

                <body>
                    <div class='container'>
                        <h1>Run4Fun</h1>
                        <h3>Inscrição realizada.</h3>
                        <h2>${e.parameter.nome}</h2>
                        <h1>Grupo: ${e.parameter.grupoAtribuido}</h1>
                        <h3>
                            <br><a href='javascript:closeWindow();'>Fechar Janela</a>
                        </h3>
                    </div>

                </body>

            </html>
            `);

        return response;

    } catch (error) {

        // Registrar log de erro
        Logger.log('Erro ao processar requisição: ' + error.message);

        // Retornar resposta de erro
        const response = ContentService.createTextOutput(JSON.stringify({
            'status': 'error',
            'message': error.message
        })).setMimeType(ContentService.MimeType.JSON);

        return response;
    }
}