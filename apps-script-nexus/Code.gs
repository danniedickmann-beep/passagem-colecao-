const CONECTA = Object.freeze({
  spreadsheetProperty: 'NEXUS_SPREADSHEET_ID',
  filesFolderProperty: 'NEXUS_FILES_FOLDER_ID',
  spreadsheetName: 'Conecta - Base da Passagem de Coleção',
  filesFolderName: 'Conecta - Arquivos da Passagem de Coleção',
  sheets: {
    colecoes: ['id', 'nome', 'ordem', 'ativa', 'created_at'],
    artigos: ['id', 'artigo', 'colecao_id', 'colecao', 'linha', 'categoria', 'mp_base', 'classificacao', 'criticidade', 'lacre', 'mostruario', 'observacoes', 'imagem_url', 'status', 'ativa', 'created_by', 'created_at', 'updated_at'],
    anexos: ['id', 'artigo_id', 'nome', 'mime_type', 'tamanho', 'descricao', 'drive_file_id', 'url', 'created_by', 'created_at'],
    pendencias: ['id', 'artigo_id', 'tipo', 'area', 'descricao', 'gravidade', 'status', 'responsavel', 'resolucao_descricao', 'resolved_by', 'resolved_at', 'created_by', 'created_at'],
    votos: ['id', 'artigo_id', 'perfil', 'usuario', 'criticidade', 'observacao', 'created_at', 'updated_at'],
    historico: ['id', 'artigo_id', 'tipo_evento', 'descricao', 'usuario', 'dados_extras', 'created_at']
  }
});

function doGet() {
  return HtmlService.createTemplateFromFile('Sem título')
    .evaluate()
    .setTitle('HERING — CONECTA — Passagem de Coleção')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function configurarConecta() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(CONECTA.spreadsheetProperty);
  let folderId = properties.getProperty(CONECTA.filesFolderProperty);

  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.create(CONECTA.spreadsheetName);

  if (!spreadsheetId) {
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(CONECTA.spreadsheetProperty, spreadsheetId);
  }

  Object.keys(CONECTA.sheets).forEach(function (name) {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    const headers = CONECTA.sheets[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#EAF2FF');
    }
  });

  const defaultSheet = spreadsheet.getSheetByName('Sheet1') || spreadsheet.getSheetByName('Página1');
  if (defaultSheet && Object.keys(CONECTA.sheets).indexOf(defaultSheet.getName()) === -1) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  if (!folderId) {
    const folder = DriveApp.createFolder(CONECTA.filesFolderName);
    folderId = folder.getId();
    properties.setProperty(CONECTA.filesFolderProperty, folderId);
  }

  return { spreadsheetId: spreadsheetId, folderId: folderId, status: 'configured' };
}

function getBootstrapData() {
  const userEmail = Session.getActiveUser().getEmail() || '';
  const configured = isConfigured_();
  return {
    configured: configured,
    userEmail: userEmail,
    collections: configured ? listRows_('colecoes').filter(function (item) { return item.ativa !== false; }) : [],
    pieces: configured ? listRows_('artigos').filter(function (item) { return item.ativa !== false; }) : [],
    generatedAt: new Date().toISOString()
  };
}

function saveCollection(payload) {
  requireConfigured_();
  const now = new Date().toISOString();
  const item = {
    id: Utilities.getUuid(),
    nome: requiredText_(payload && payload.nome, 'Informe o nome da coleção.'),
    ordem: Number(payload && payload.ordem) || Date.now(),
    ativa: true,
    created_at: now
  };
  appendObject_('colecoes', item);
  return item;
}

function savePiece(payload) {
  requireConfigured_();
  const required = ['artigo', 'colecao', 'linha', 'categoria', 'mp_base', 'classificacao', 'criticidade', 'lacre', 'mostruario'];
  required.forEach(function (field) { requiredText_(payload && payload[field], 'Preencha todos os campos obrigatórios.'); });
  const now = new Date().toISOString();
  const user = Session.getActiveUser().getEmail() || 'Usuário não identificado';
  const item = {
    id: Utilities.getUuid(),
    artigo: String(payload.artigo).trim(),
    colecao_id: String(payload.colecao_id || ''),
    colecao: String(payload.colecao).trim(),
    linha: String(payload.linha).trim(),
    categoria: String(payload.categoria).trim(),
    mp_base: String(payload.mp_base).trim(),
    classificacao: String(payload.classificacao).trim(),
    criticidade: String(payload.criticidade).trim(),
    lacre: String(payload.lacre).trim(),
    mostruario: String(payload.mostruario).trim(),
    observacoes: String(payload.observacoes || '').trim(),
    imagem_url: String(payload.imagem_url || ''),
    status: 'cadastro',
    ativa: true,
    created_by: user,
    created_at: now,
    updated_at: now
  };
  appendObject_('artigos', item);
  appendObject_('historico', {
    id: Utilities.getUuid(), artigo_id: item.id, tipo_evento: 'cadastro',
    descricao: 'Artigo cadastrado.', usuario: user, dados_extras: '{}', created_at: now
  });
  return item;
}

function updatePiece(id, payload) {
  requireConfigured_();
  const required = ['artigo', 'colecao', 'linha', 'categoria', 'mp_base', 'classificacao', 'criticidade', 'lacre', 'mostruario'];
  required.forEach(function (field) { requiredText_(payload && payload[field], 'Preencha todos os campos obrigatórios.'); });
  const patch = Object.assign({}, payload, { updated_at: new Date().toISOString() });
  const item = updateRow_('artigos', id, patch);
  appendObject_('historico', { id: Utilities.getUuid(), artigo_id: id, tipo_evento: 'edicao', descricao: 'Dados do artigo atualizados.', usuario: Session.getActiveUser().getEmail() || '', dados_extras: '{}', created_at: new Date().toISOString() });
  return item;
}

function setPieceArchived(id, archived) {
  requireConfigured_();
  const item = updateRow_('artigos', id, { ativa: !archived, updated_at: new Date().toISOString() });
  appendObject_('historico', { id: Utilities.getUuid(), artigo_id: id, tipo_evento: archived ? 'arquivamento' : 'restauracao', descricao: archived ? 'Artigo arquivado.' : 'Artigo restaurado.', usuario: Session.getActiveUser().getEmail() || '', dados_extras: '{}', created_at: new Date().toISOString() });
  return item;
}

function getOperationalData() {
  requireConfigured_();
  return { pendencias: listRows_('pendencias'), historico: listRows_('historico'), votos: listRows_('votos') };
}

function saveCriticalityVote(payload) {
  requireConfigured_();
  const articleId = requiredText_(payload && payload.artigo_id, 'Selecione um artigo.');
  const sector = requiredText_(payload && payload.perfil, 'Selecione o setor.');
  const score = Number(payload && payload.criticidade);
  if (score < 1 || score > 5) throw new Error('Informe uma nota de criticidade entre 1 e 5.');
  const now = new Date().toISOString();
  const user = Session.getActiveUser().getEmail() || 'Participante não identificado';
  const votes = listRows_('votos');
  const existing = votes.find(function (item) {
    return String(item.artigo_id) === String(articleId) && String(item.perfil) === String(sector) && String(item.usuario) === String(user);
  });
  let item;
  if (existing) {
    item = updateRow_('votos', existing.id, { criticidade: score, observacao: String(payload.observacao || ''), updated_at: now });
  } else {
    item = { id: Utilities.getUuid(), artigo_id: articleId, perfil: sector, usuario: user, criticidade: score, observacao: String(payload.observacao || ''), created_at: now, updated_at: now };
    appendObject_('votos', item);
  }
  appendObject_('historico', { id: Utilities.getUuid(), artigo_id: articleId, tipo_evento: 'avaliacao_criticidade', descricao: 'Criticidade ' + score + '/5 registrada por ' + sector + '.', usuario: user, dados_extras: JSON.stringify({ setor: sector, nota: score }), created_at: now });
  return item;
}

function createIssue(payload) {
  requireConfigured_();
  const now = new Date().toISOString();
  const user = Session.getActiveUser().getEmail() || '';
  const item = { id: Utilities.getUuid(), artigo_id: requiredText_(payload.artigo_id, 'Selecione um artigo.'), tipo: requiredText_(payload.tipo, 'Informe o tipo do problema.'), area: requiredText_(payload.area, 'Informe a área.'), descricao: requiredText_(payload.descricao, 'Descreva o apontamento.'), gravidade: requiredText_(payload.gravidade, 'Informe a gravidade.'), status: 'aberta', responsavel: String(payload.responsavel || ''), resolucao_descricao: '', resolved_by: '', resolved_at: '', created_by: user, created_at: now };
  appendObject_('pendencias', item);
  appendObject_('historico', { id: Utilities.getUuid(), artigo_id: item.artigo_id, tipo_evento: 'apontamento', descricao: item.descricao, usuario: user, dados_extras: JSON.stringify({ tipo: item.tipo, area: item.area, gravidade: item.gravidade }), created_at: now });
  return item;
}

function resolveIssue(id, resolution) {
  requireConfigured_();
  const text = requiredText_(resolution, 'Descreva como o problema foi resolvido.');
  const now = new Date().toISOString();
  const user = Session.getActiveUser().getEmail() || '';
  const item = updateRow_('pendencias', id, { status: 'resolvida', resolucao_descricao: text, resolved_by: user, resolved_at: now });
  appendObject_('historico', { id: Utilities.getUuid(), artigo_id: item.artigo_id, tipo_evento: 'solucao', descricao: text, usuario: user, dados_extras: JSON.stringify({ pendencia_id: id }), created_at: now });
  return item;
}

function uploadArticleImage(payload) {
  requireConfigured_();
  if (!payload || !payload.base64 || !payload.mimeType || !String(payload.mimeType).startsWith('image/')) throw new Error('Selecione uma imagem válida.');
  const bytes = Utilities.base64Decode(payload.base64);
  if (bytes.length > 10 * 1024 * 1024) throw new Error('A imagem principal deve ter no máximo 10 MB.');
  const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty(CONECTA.filesFolderProperty));
  const safeName = String(payload.name || 'imagem').replace(/[^a-zA-Z0-9._-]/g, '-');
  const file = folder.createFile(Utilities.newBlob(bytes, payload.mimeType, Utilities.getUuid() + '-' + safeName));
  return { id: file.getId(), url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200', name: file.getName() };
}

function isConfigured_() {
  const properties = PropertiesService.getScriptProperties();
  return Boolean(properties.getProperty(CONECTA.spreadsheetProperty) && properties.getProperty(CONECTA.filesFolderProperty));
}

function requireConfigured_() {
  if (!isConfigured_()) throw new Error('O Conecta ainda não foi configurado. Execute configurarConecta no editor do Apps Script.');
}

function spreadsheet_() {
  requireConfigured_();
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(CONECTA.spreadsheetProperty));
}

function listRows_(sheetName) {
  const sheet = spreadsheet_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values.map(function (row) {
    return headers.reduce(function (item, header, index) { item[header] = row[index]; return item; }, {});
  });
}

function appendObject_(sheetName, object) {
  const sheet = spreadsheet_().getSheetByName(sheetName);
  const headers = CONECTA.sheets[sheetName];
  sheet.appendRow(headers.map(function (header) { return object[header] === undefined ? '' : object[header]; }));
}

function updateRow_(sheetName, id, patch) {
  const sheet = spreadsheet_().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  for (let row = 1; row < values.length; row += 1) {
    if (String(values[row][idIndex]) !== String(id)) continue;
    headers.forEach(function (header, column) {
      if (Object.prototype.hasOwnProperty.call(patch, header)) sheet.getRange(row + 1, column + 1).setValue(patch[header]);
    });
    return headers.reduce(function (item, header, column) { item[header] = Object.prototype.hasOwnProperty.call(patch, header) ? patch[header] : values[row][column]; return item; }, {});
  }
  throw new Error('Artigo não encontrado.');
}

function requiredText_(value, message) {
  if (value === undefined || value === null || String(value).trim() === '') throw new Error(message);
  return String(value).trim();
}

