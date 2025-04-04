function _getGroup(_group="0") {
    const sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1qfZmLYsRXiYHMamWLyaDTK1qU28VP4jBCDFlCmeRjDY/edit').getSheetByName('Run4Fun');
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
        // ID da planilha Run4Fun - Substitua pelo ID da sua planilha
        const sheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1qfZmLYsRXiYHMamWLyaDTK1qU28VP4jBCDFlCmeRjDY/edit').getSheetByName('Run4Fun');

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

        e.parameter.group = group;

        // Registrar log de sucesso
        Logger.log('Dados adicionados com sucesso: ' + JSON.stringify(e.parameter));

        // const response = HtmlService.createHtmlOutput("" +
        //     "<HTML><HEAD><script language=\"javascript\" type=\"text/javascript\">" +
        //     "function closeWindow() {" +
        //     "top.close();" +
        //     "}" +
        //     "</script></HEAD>" +
        //     "<BODY><h1>Run4Fun</h1><h3>Incrição de " +
        //     e.parameter.nome +
        //     " realizada.<br><a href=\"javascript:closeWindow();\">Fechar Janela</a></h3></BODY></HTML>");

        // return response;

        // return ContentService
        //   .createTextOutput(e.parameter.callback + "(" + JSON.stringify(e.parameter)+ ")")
        //   .setMimeType(ContentService.MimeType.JAVASCRIPT);

        var response = {
          "code": 200,
          "message": "I'm the get"
        };
        return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);

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