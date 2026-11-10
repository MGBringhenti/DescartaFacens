CREATE TABLE usuario (
id_usuario SERIAL PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
telefone VARCHAR(15) NOT NULL,
data_cadastro TIMESTAMP NOT NULL,
saldo_pontos INTEGER DEFAULT 0
);

CREATE TABLE material (
id_material SERIAL PRIMARY KEY,
nome VARCHAR(100) NOT NULL UNIQUE,
descricao TEXT,
pontos_kg INTEGER NOT NULL,
instrucoes_descarte TEXT
);

CREATE TABLE ponto_coleta(
id_ponto SERIAL PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
endereco VARCHAR(150) NOT NULL,
latitude DECIMAL(10,7),
longitude DECIMAL(10,7),
horario_funcionamento VARCHAR(100),
ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE descarte (
id_descarte SERIAL PRIMARY KEY,
id_usuario INTEGER NOT NULL,
id_material INTEGER NOT NULL,
id_ponto INTEGER NOT NULL,
quantidade_kg DECIMAL(10,2) NOT NULL,
data_descarte TIMESTAMP NOT NULL,
FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario),
FOREIGN KEY(id_material) REFERENCES material(id_material),
FOREIGN KEY(id_ponto) REFERENCES ponto_coleta(id_ponto)
);

CREATE TABLE parceiro(
id_parceiro SERIAL PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
cnpj VARCHAR(14) UNIQUE,
endereco VARCHAR(200) NOT NULL,
telefone VARCHAR(15) NOT NULL,
ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE recompensa(
id_recompensa SERIAL PRIMARY KEY,
id_parceiro INTEGER NOT NULL,
nome VARCHAR(100) NOT NULL,
descricao TEXT,
custo_pontos INTEGER NOT NULL,
quantidade_disponivel INTEGER NOT NULL,
data_validade DATE,
ativo BOOLEAN DEFAULT TRUE,
FOREIGN KEY(id_parceiro) REFERENCES parceiro(id_parceiro)
);

CREATE TABLE resgate(
id_resgate SERIAL PRIMARY KEY,
id_usuario INTEGER NOT NULL,
id_recompensa INTEGER NOT NULL,
pontos_utilizados INTEGER NOT NULL,
data_resgate TIMESTAMP NOT NULL,
FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario),
FOREIGN KEY (id_recompensa) REFERENCES recompensa(id_recompensa)
);

INSERT INTO usuario (nome, email, telefone, data_cadastro, saldo_pontos)
VALUES
('Lucas Ferreira', 'lucas@email.com', '15999887766', '2026-10-01 09:30:00', 200),
('Ana Oliveira', 'ana@email.com', '15988776655', '2026-10-03 14:20:00', 150),
('Pedro Santos', 'pedro@email.com', '15977665544', '2026-10-05 10:15:00', 350);

INSERT INTO material (nome, descricao, pontos_kg, instrucoes_descarte)
VALUES
('Plástico', 'Garrafas PET e embalagens plásticas', 100, 'Lavar e separar as embalagens'),
('Papel', 'Papelão, jornais e folhas', 50, 'Manter o papel seco e limpo'),
('Vidro', 'Garrafas e potes de vidro', 30, 'Embalar vidros quebrados com segurança'),
('Metal', 'Latas de alumínio e outros metais', 150, 'Limpar as embalagens antes do descarte');

INSERT INTO ponto_coleta (nome, endereco, latitude, longitude, horario_funcionamento, ativo)
VALUES
('Ecoponto Central', 'Rua Ambiental, 100 - Sorocaba', -23.5012000, -47.4583000, '08:00 às 18:00', TRUE),
('Coleta Zona Norte', 'Av. Reciclagem, 250 - Sorocaba', -23.4700000, -47.4800000, '09:00 às 17:00', TRUE),
('Ecoponto Zona Sul', 'Rua Sustentável, 50 - Sorocaba', -23.5300000, -47.4500000, '08:00 às 16:00', TRUE);

INSERT INTO parceiro (nome, cnpj, endereco, telefone, ativo)
VALUES
('Café Verde', '12345678000190', 'Rua das Flores, 200 - Sorocaba', '1532321111', TRUE),
('EcoStore', '98765432000110', 'Av. Central, 500 - Sorocaba', '1532322222', TRUE),
('Mercado Sustentável', '11222333000144', 'Rua Comércio, 100 - Sorocaba', '1532323333', TRUE);

INSERT INTO recompensa (id_parceiro, nome, descricao, custo_pontos, quantidade_disponivel, data_validade, ativo)
VALUES
(1, 'Café gratuito', 'Troque seus pontos por um café', 500, 20, '2027-12-31', TRUE),
(2, 'Desconto de 10%', 'Desconto em produtos selecionados', 200, 50, '2027-12-31', TRUE),
(3, 'Vale-compras de R$ 20', 'Vale para compras no mercado', 300, 15, '2027-12-31', TRUE);

INSERT INTO descarte (id_usuario, id_material, id_ponto, quantidade_kg, data_descarte)
VALUES
(1, 1, 1, 3.00, '2026-10-10 10:30:00'),
(1, 4, 2, 2.00, '2026-10-12 14:15:00'),
(1, 2, 1, 2.00, '2026-10-14 09:00:00'),
(2, 1, 2, 2.00, '2026-10-11 11:20:00'),
(2, 3, 3, 5.00, '2026-10-15 16:30:00'),
(3, 2, 1, 4.00, '2026-10-16 08:45:00'),
(3, 4, 3, 1.00, '2026-10-18 13:10:00');

INSERT INTO resgate (id_usuario, id_recompensa, pontos_utilizados, data_resgate)
VALUES
(1, 1, 500, '2026-10-20 12:00:00'),
(2, 2, 200, '2026-10-21 15:30:00');
