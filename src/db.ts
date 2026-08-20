import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Em redes com proxy que inspeciona a conexão (como as da escola), o
  // certificado apresentado não é o do Neon, e o Node recusa a conexão
  // com rejectUnauthorized: true. O material do curso usa false por isso -
  // é uma troca de segurança consciente para viabilizar o laboratório.
  ssl: { rejectUnauthorized: false },
})

export async function inicializarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id SERIAL PRIMARY KEY,
      placa VARCHAR(10) NOT NULL UNIQUE,
      modelo VARCHAR(100) NOT NULL,
      marca VARCHAR(100) NOT NULL,
      ano INTEGER NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS motoristas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      cnh VARCHAR(20) NOT NULL UNIQUE,
      telefone VARCHAR(20) NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS manutencoes (
      id SERIAL PRIMARY KEY,
      id_veiculo INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
      tipo_servico VARCHAR(150) NOT NULL,
      data DATE NOT NULL,
      quilometragem INTEGER NOT NULL,
      custo NUMERIC(10, 2) NOT NULL
    );
  `)

  console.log('Banco de dados inicializado com sucesso.')
}