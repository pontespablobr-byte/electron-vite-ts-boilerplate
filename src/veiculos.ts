import { pool } from './db'

export interface Veiculo {
  id?: number
  placa: string
  modelo: string
  marca: string
  ano: number
}

export async function listarVeiculos(): Promise<Veiculo[]> {
  const resultado = await pool.query('SELECT * FROM veiculos ORDER BY id ASC')
  return resultado.rows
}

export async function buscarVeiculoPorId(id: number): Promise<Veiculo | null> {
  const resultado = await pool.query('SELECT * FROM veiculos WHERE id = $1', [id])
  return resultado.rows[0] ?? null
}

export async function criarVeiculo(veiculo: Veiculo): Promise<Veiculo> {
  const { placa, modelo, marca, ano } = veiculo
  const resultado = await pool.query(
    `INSERT INTO veiculos (placa, modelo, marca, ano)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [placa, modelo, marca, ano]
  )
  return resultado.rows[0]
}

export async function atualizarVeiculo(veiculo: Veiculo): Promise<Veiculo> {
  const { id, placa, modelo, marca, ano } = veiculo
  const resultado = await pool.query(
    `UPDATE veiculos SET placa = $1, modelo = $2, marca = $3, ano = $4
     WHERE id = $5 RETURNING *`,
    [placa, modelo, marca, ano, id]
  )
  return resultado.rows[0]
}

export async function excluirVeiculo(id: number): Promise<void> {
  await pool.query('DELETE FROM veiculos WHERE id = $1', [id])
}