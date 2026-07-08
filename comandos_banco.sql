-- =============================================================================
-- SCRIPT DE CRIAÇÃO E POVOAMENTO DO BANCO DE DADOS: DOAÇÃO DE SANGUE
-- ARQUITETURA DE SISTEMAS / TRABALHO ESCOLAR
-- =============================================================================

-- 1. CRIAÇÃO DAS TABELAS

-- Tabela de Cidades em Alerta Crítico
CREATE TABLE cidades_alerta (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    nome_cidade VARCHAR(100) NOT NULL,
    estado_cidade CHAR(2) NOT NULL,
    nivel_critico VARCHAR(20) DEFAULT 'Máximo',
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado_alerta CHECK (LENGTH(estado_cidade) = 2)
);

-- Tabela de Doadores
CREATE TABLE doadores (
    id_doador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    tipo_sanguineo VARCHAR(3) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_sanguineo CHECK (tipo_sanguineo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT chk_estado_doador CHECK (LENGTH(estado) = 2)
);


-- =============================================================================
-- 2. COMANDOS INSERT (POVOAMENTO PARA TESTES)

-- Inserindo cidades que estão em estado crítico de estoque de sangue
INSERT INTO cidades_alerta (nome_cidade, estado_cidade, nivel_critico) VALUES 
('Lages', 'SC', 'Crítico'),
('Florianópolis', 'SC', 'Crítico'),
('São Paulo', 'SP', 'Altíssimo'),
('Curitiba', 'PR', 'Moderado');

-- Inserindo doadores de teste
-- Nota: Antoni e Maah estão em cidades com alerta ativo; Carlos está em uma cidade segura.
INSERT INTO doadores (nome, tipo_sanguineo, email, telefone, cidade, estado) VALUES 
('Antoni Gregory', 'O+', 'antoni.gregory@email.com', '(49) 99999-1111', 'Lages', 'SC'),
('Maah Melegari', 'A-', 'maah.melegari@email.com', '(48) 98888-2222', 'Florianópolis', 'SC'),
('Carlos Silva', 'AB+', 'carlos.silva@email.com', '(11) 97777-3333', 'Campinas', 'SP'),
('Ana Souza', 'O-', 'ana.souza@email.com', '(41) 96666-4444', 'Curitiba', 'PR');


-- =============================================================================
-- 3. CONSULTA SELECT (INNER JOIN)
-- Simula a lógica do Controller: Busca o doador e cruza com a tabela de alertas
-- para identificar se a cidade dele precisa urgentemente de doações.

SELECT 
    d.id_doador,
    d.nome AS nome_doador,
    d.cidade AS cidade_doador,
    d.estado AS estado_doador,
    d.tipo_sanguineo,
    ca.nivel_critico AS status_alerta,
    ca.data_registro AS data_inicio_alerta
FROM 
    doadores d
INNER JOIN 
    cidades_alerta ca ON LOWER(TRIM(d.cidade)) = LOWER(TRIM(ca.nome_cidade)) 
                     AND LOWER(TRIM(d.estado)) = LOWER(TRIM(ca.estado_cidade))
ORDER BY 
    ca.data_registro DESC;

-- 💡 DICA PARA O TRABALHO: 
-- O JOIN acima utiliza LOWER(TRIM()) para garantir que diferenças de espaços ou 
-- letras maiúsculas/minúsculas digitadas pelo usuário não quebrem o cruzamento dos dados.