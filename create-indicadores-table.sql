-- Script para criar tabela de indicadores
-- Execute: docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < create-indicadores-table.sql

-- Criar tabela indicadores se não existir
CREATE TABLE IF NOT EXISTS indicadores (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  senha VARCHAR(255) NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP NULL,
  ativo TINYINT(1) DEFAULT 1,
  created_by VARCHAR(36),
  saldo_disponivel DECIMAL(10,2) DEFAULT 0.00,
  saldo_bloqueado DECIMAL(10,2) DEFAULT 0.00,
  saldo_perdido DECIMAL(10,2) DEFAULT 0.00,
  total_indicacoes INT DEFAULT 0,
  indicacoes_respondidas INT DEFAULT 0,
  indicacoes_convertidas INT DEFAULT 0,
  avatar VARCHAR(255),
  FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL
);

-- Criar tabela saques_indicador se não existir
CREATE TABLE IF NOT EXISTS saques_indicador (
  id VARCHAR(36) PRIMARY KEY,
  indicador_id VARCHAR(36) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'solicitado',
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_processamento TIMESTAMP NULL,
  observacoes TEXT,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
);

-- Mostrar resultado
SELECT 'Tabela indicadores criada com sucesso!' AS Info;
SELECT 'Tabela saques_indicador criada com sucesso!' AS Info;

-- Verificar estrutura
DESCRIBE indicadores;
DESCRIBE saques_indicador;
