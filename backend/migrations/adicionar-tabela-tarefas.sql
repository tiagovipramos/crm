-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id VARCHAR(36) NOT NULL,
  consultor_id VARCHAR(36) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_hora DATETIME NOT NULL,
  status ENUM('pendente', 'concluida', 'cancelada') DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  concluida_em TIMESTAMP NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (consultor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_lead_id (lead_id),
  INDEX idx_consultor_id (consultor_id),
  INDEX idx_data_hora (data_hora),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
