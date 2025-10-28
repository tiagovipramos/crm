-- Tabela para Campanhas de Envio em Massa
CREATE TABLE IF NOT EXISTS campanhas_envio (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  consultor_id VARCHAR(36) NOT NULL,
  status ENUM('rascunho', 'agendada', 'em_andamento', 'pausada', 'concluida', 'cancelada') DEFAULT 'rascunho',
  
  -- Seleção de destinatários
  filtro_funil TEXT, -- JSON array com status do funil
  arquivo_csv TEXT, -- Caminho do arquivo CSV importado
  destinatarios TEXT NOT NULL, -- JSON array com {id, nome, telefone, ...}
  total_destinatarios INT DEFAULT 0,
  
  -- Mensagens
  mensagens TEXT NOT NULL, -- JSON array com as mensagens para rotação
  usar_variaveis BOOLEAN DEFAULT TRUE,
  
  -- Configurações de temporização
  intervalo_segundos INT DEFAULT 3,
  pausar_a_cada INT DEFAULT 50,
  tempo_pausa_minutos INT DEFAULT 5,
  
  -- Opções
  randomizar_ordem BOOLEAN DEFAULT TRUE,
  pular_duplicados BOOLEAN DEFAULT TRUE,
  salvar_historico BOOLEAN DEFAULT TRUE,
  notificar_conclusao BOOLEAN DEFAULT TRUE,
  
  -- Estatísticas
  enviados INT DEFAULT 0,
  lidos INT DEFAULT 0,
  falhas INT DEFAULT 0,
  pendentes INT DEFAULT 0,
  
  -- Controle de execução
  indice_atual INT DEFAULT 0,
  data_inicio DATETIME,
  data_fim DATETIME,
  data_proxima_pausa DATETIME,
  tempo_estimado_minutos INT,
  
  -- Timestamps
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (consultor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_consultor (consultor_id),
  INDEX idx_status (status),
  INDEX idx_data_criacao (data_criacao)
);

-- Tabela para Logs de Envio Individual
CREATE TABLE IF NOT EXISTS campanhas_envio_logs (
  id VARCHAR(36) PRIMARY KEY,
  campanha_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36),
  
  nome_destinatario VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  
  mensagem_enviada TEXT,
  mensagem_index INT, -- Qual mensagem da rotação foi usada
  
  status ENUM('pendente', 'enviando', 'enviado', 'lido', 'falha') DEFAULT 'pendente',
  erro TEXT,
  
  data_envio DATETIME,
  data_leitura DATETIME,
  
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campanha_id) REFERENCES campanhas_envio(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  INDEX idx_campanha (campanha_id),
  INDEX idx_status (status),
  INDEX idx_data_envio (data_envio)
);
