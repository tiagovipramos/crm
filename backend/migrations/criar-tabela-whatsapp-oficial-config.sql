-- Migration para criar tabela de configuração da API Oficial do WhatsApp

CREATE TABLE IF NOT EXISTS whatsapp_oficial_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultor_id INT NOT NULL,
  phone_number_id VARCHAR(100) NOT NULL COMMENT 'ID do número de telefone no WhatsApp Business API',
  access_token TEXT NOT NULL COMMENT 'Token de acesso da API oficial',
  webhook_verify_token VARCHAR(255) NOT NULL COMMENT 'Token de verificação do webhook',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_consultor (consultor_id),
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
