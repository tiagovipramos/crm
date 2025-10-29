# Como Executar as Migrations Manualmente

O script automático falhou porque `mysql` não está no PATH do Windows.

## Método 1: Usar phpMyAdmin (RECOMENDADO)

1. Abra o navegador e acesse: `http://localhost/phpmyadmin`
2. Faça login (usuário: `root`, sem senha geralmente)
3. Selecione o banco de dados `crm_vipseg` na barra lateral
4. Clique na aba **SQL** no topo
5. Cole o conteúdo do arquivo `migrations/adicionar-tipo-api-whatsapp.sql`:

```sql
-- Migration para adicionar tipo de API do WhatsApp
-- Adiciona coluna para armazenar qual API usar: 'oficial' ou 'nao_oficial'

ALTER TABLE consultores 
ADD COLUMN tipo_api_whatsapp VARCHAR(20) DEFAULT 'nao_oficial' 
COMMENT 'Tipo de API WhatsApp: oficial ou nao_oficial';

-- Atualizar consultores existentes para usar API não oficial (padrão)
UPDATE consultores SET tipo_api_whatsapp = 'nao_oficial' WHERE tipo_api_whatsapp IS NULL;
```

6. Clique em **Executar** (ou **Go**)
7. Repita o processo com o arquivo `migrations/criar-tabela-whatsapp-oficial-config.sql`:

```sql
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
```

8. Clique em **Executar** (ou **Go**)

## Método 2: Usar MySQL Workbench

1. Abra o MySQL Workbench
2. Conecte ao servidor local (localhost)
3. Selecione o schema `crm_vipseg`
4. Abra os arquivos SQL e execute-os

## Método 3: Linha de comando com caminho completo do MySQL

Se você tiver XAMPP instalado, o MySQL geralmente está em:
`C:\xampp\mysql\bin\mysql.exe`

Execute no CMD:

```cmd
cd C:\xampp3\htdocs\crm\backend
C:\xampp\mysql\bin\mysql.exe -u root crm_vipseg < migrations\adicionar-tipo-api-whatsapp.sql
C:\xampp\mysql\bin\mysql.exe -u root crm_vipseg < migrations\criar-tabela-whatsapp-oficial-config.sql
```

**Ajuste o caminho** conforme sua instalação do XAMPP.

## Verificar se funcionou

Após executar as migrations, reinicie o backend e recarregue a página do CRM.
O erro deve desaparecer e você poderá escolher entre as APIs.
