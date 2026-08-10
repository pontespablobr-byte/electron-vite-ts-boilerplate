import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // necessário para Neon
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
  console.log('Banco de dados inicializado com sucesso.')
}