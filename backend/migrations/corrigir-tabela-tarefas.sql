-- Remover tabela se existir
DROP TABLE IF EXISTS tarefas;

-- Criar tabela de tarefas SEM foreign keys para evitar problemas
CREATE TABLE tarefas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id VARCHAR(255) NOT NULL,
  consultor_id VARCHAR(255) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_hora DATETIME NOT NULL,
  status ENUM('pendente', 'concluida', 'cancelada') DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  concluida_em TIMESTAMP NULL,
  INDEX idx_lead_id (lead_id),
  INDEX idx_consultor_id (consultor_id),
  INDEX idx_data_hora (data_hora),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
