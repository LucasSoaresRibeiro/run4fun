function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doPost(e) {
  // Configurar cabeçalhos CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Obter os dados da requisição
    const data = JSON.parse(e.postData.contents);
    
    // Validar os dados recebidos
    if (!data.nome || !data.celular || !data.genero) {
      throw new Error('Dados incompletos');
    }
    
    // ID da planilha Run4Fun - Substitua pelo ID da sua planilha
    const spreadsheetId = 'YOUR_SPREADSHEET_ID';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    
    // Adicionar nova linha com os dados
    sheet.appendRow([data.nome, data.celular, data.genero, new Date()]);
    
    // Registrar log de sucesso
    Logger.log('Dados adicionados com sucesso: ' + JSON.stringify(data));
    
    // Retornar resposta de sucesso
    const response = ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Dados adicionados com sucesso'
    })).setMimeType(ContentService.MimeType.JSON);
    
    // Adicionar cabeçalhos CORS à resposta
    Object.keys(headers).forEach(key => response.setHeader(key, headers[key]));
    return response;
    
  } catch (error) {
    // Registrar log de erro
    Logger.log('Erro ao processar requisição: ' + error.message);
    
    // Retornar resposta de erro
    const response = ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.message
    })).setMimeType(ContentService.MimeType.JSON);
    
    // Adicionar cabeçalhos CORS à resposta de erro
    Object.keys(headers).forEach(key => response.setHeader(key, headers[key]));
    return response;
  }
}