-- Protecar CRM - Schema do Banco de Dados PostgreSQL

-- Criar banco de dados (executar separadamente)
-- CREATE DATABASE protecar_crm;

-- Conectar ao banco protecar_crm antes de executar o resto

-- =========================================
-- TABELA: consultores
-- =========================================
CREATE TABLE IF NOT EXISTS consultores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  avatar TEXT,
  sessao_whatsapp TEXT,
  status_conexao VARCHAR(20) DEFAULT 'offline',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP
);

-- =========================================
-- TABELA: leads
-- =========================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  cidade VARCHAR(100),
  modelo_veiculo VARCHAR(100),
  placa_veiculo VARCHAR(20),
  ano_veiculo INTEGER,
  origem VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  consultor_id UUID REFERENCES consultores(id) ON DELETE CASCADE,
  observacoes TEXT,
  ultima_mensagem TEXT,
  mensagens_nao_lidas INTEGER DEFAULT 0,
  tags TEXT[],
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABELA: mensagens
-- =========================================
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES consultores(id),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto',
  remetente VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'enviada',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  media_url TEXT,
  media_name TEXT
);

-- =========================================
-- TABELA: propostas
-- =========================================
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  consultor_id UUID REFERENCES consultores(id),
  plano VARCHAR(20) NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  franquia DECIMAL(10,2) NOT NULL,
  coberturas TEXT[],
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'rascunho',
  link_proposta TEXT,
  pdf_url TEXT,
  data_envio TIMESTAMP,
  data_visualizacao TIMESTAMP,
  data_resposta TIMESTAMP
);

-- =========================================
-- TABELA: tarefas
-- =========================================
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id UUID REFERENCES consultores(id),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  data_lembrete TIMESTAMP NOT NULL,
  concluida BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP
);

-- =========================================
-- TABELA: templates
-- =========================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id UUID REFERENCES consultores(id),
  nome VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(50),
  ativo BOOLEAN DEFAULT TRUE
);

-- =========================================
-- ÍNDICES para melhor performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_leads_consultor ON leads(consultor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_mensagens_lead ON mensagens(lead_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp ON mensagens(timestamp);
CREATE INDEX IF NOT EXISTS idx_tarefas_consultor ON tarefas(consultor_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida);

-- =========================================
-- DADOS INICIAIS (Seed)
-- =========================================

-- Inserir consultor de teste (senha: 123456)
INSERT INTO consultores (nome, email, senha, telefone, status_conexao)
VALUES (
  'Carlos Silva',
  'carlos@protecar.com',
  '$2a$10$rOzJqKZXHjKGzK5fY.pGYO0/dZqN3E5mCpqj5ZCXy9J5QKLKBz1Wm',
  '11987654321',
  'offline'
) ON CONFLICT (email) DO NOTHING;

-- =========================================
-- FUNÇÃO: Atualizar data_atualizacao automaticamente
-- =========================================
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para leads
CREATE TRIGGER trigger_update_leads
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_data_atualizacao();

-- =========================================
-- VERIFICAR INSTALAÇÃO
-- =========================================
SELECT 'Schema criado com sucesso!' AS status;
SELECT COUNT(*) AS total_tabelas FROM information_schema.tables WHERE table_schema = 'public';
