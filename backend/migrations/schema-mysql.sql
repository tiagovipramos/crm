-- Protecar CRM - Schema MySQL (XAMPP)

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS protecar_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE protecar_crm;

-- =========================================
-- TABELA: consultores
-- =========================================
CREATE TABLE IF NOT EXISTS consultores (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  avatar TEXT,
  sessao_whatsapp TEXT,
  status_conexao VARCHAR(20) DEFAULT 'offline',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABELA: leads
-- =========================================
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  cidade VARCHAR(100),
  modelo_veiculo VARCHAR(100),
  placa_veiculo VARCHAR(20),
  ano_veiculo INT,
  origem VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  consultor_id VARCHAR(36),
  observacoes TEXT,
  ultima_mensagem TEXT,
  mensagens_nao_lidas INT DEFAULT 0,
  tags JSON,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE,
  INDEX idx_consultor (consultor_id),
  INDEX idx_status (status),
  INDEX idx_telefone (telefone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABELA: mensagens
-- =========================================
CREATE TABLE IF NOT EXISTS mensagens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lead_id VARCHAR(36),
  consultor_id VARCHAR(36),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto',
  remetente VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'enviada',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  media_url TEXT,
  media_name TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id),
  INDEX idx_lead (lead_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABELA: propostas
-- =========================================
CREATE TABLE IF NOT EXISTS propostas (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  lead_id VARCHAR(36),
  consultor_id VARCHAR(36),
  plano VARCHAR(20) NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  franquia DECIMAL(10,2) NOT NULL,
  coberturas JSON,
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'rascunho',
  link_proposta TEXT,
  pdf_url TEXT,
  data_envio TIMESTAMP NULL,
  data_visualizacao TIMESTAMP NULL,
  data_resposta TIMESTAMP NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABELA: tarefas
-- =========================================
CREATE TABLE IF NOT EXISTS tarefas (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  consultor_id VARCHAR(36),
  lead_id VARCHAR(36),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  data_lembrete TIMESTAMP NOT NULL,
  concluida BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP NULL,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_consultor (consultor_id),
  INDEX idx_concluida (concluida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TABELA: templates
-- =========================================
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  consultor_id VARCHAR(36),
  nome VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(50),
  ativo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- DADOS INICIAIS (Seed)
-- =========================================

-- Inserir consultor admin (senha: admin123)
INSERT INTO consultores (id, nome, email, senha, telefone, status_conexao)
VALUES (
  'b9bc4ffc-ade8-11f0-9914-8cb0e93127ca',
  'Administrador',
  'admin@protecar.com',
  '$2a$10$cN6ppacqn0lyZk1ZyYxhBOxD6Ph9h0dytY6lOJ/qjLGzysr7zAW2.',
  '11987654321',
  'offline'
) ON DUPLICATE KEY UPDATE nome=nome;

-- Inserir consultor de teste (senha: 123456)
INSERT INTO consultores (id, nome, email, senha, telefone, status_conexao)
VALUES (
  UUID(),
  'Carlos Silva',
  'carlos@protecar.com',
  '$2a$10$rOzJqKZXHjKGzK5fY.pGYO0/dZqN3E5mCpqj5ZCXy9J5QKLKBz1Wm',
  '11987654321',
  'offline'
) ON DUPLICATE KEY UPDATE nome=nome;

-- =========================================
-- VERIFICAR INSTALAÇÃO
-- =========================================
SELECT 'Schema MySQL criado com sucesso!' AS status;
SELECT COUNT(*) AS total_tabelas FROM information_schema.tables WHERE table_schema = 'protecar_crm';
