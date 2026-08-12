import { pool } from './db'

export interface Manutencao {
  id?: number
  id_veiculo: number
  tipo_servico: string
  data: string
  quilometragem: number
  custo: number
}

export type CriarManutencaoDto = Omit<Manutencao, 'id'>
export type AtualizarManutencaoDto = Partial<CriarManutencaoDto>

export async function findAllManutencoes(): Promise<Manutencao[]> {
  const { rows } = await pool.query<Manutencao>(
    'SELECT * FROM manutencoes ORDER BY data DESC'
  )
  return rows
}

export async function findOneManutencao(id: number): Promise<Manutencao | null> {
  const { rows } = await pool.query<Manutencao>(
    'SELECT * FROM manutencoes WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function findManutencoesPorVeiculo(idVeiculo: number): Promise<Manutencao[]> {
  const { rows } = await pool.query<Manutencao>(
    'SELECT * FROM manutencoes WHERE id_veiculo = $1 ORDER BY data DESC',
    [idVeiculo]
  )
  return rows
}

export async function createManutencao(dto: CriarManutencaoDto): Promise<Manutencao> {
  const { rows } = await pool.query<Manutencao>(
    `INSERT INTO manutencoes (id_veiculo, tipo_servico, data, quilometragem, custo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [dto.id_veiculo, dto.tipo_servico, dto.data, dto.quilometragem, dto.custo]
  )
  return rows[0]
}

export async function updateManutencao(
  id: number,
  dto: AtualizarManutencaoDto
): Promise<Manutencao | null> {
  const { rows } = await pool.query<Manutencao>(
    `UPDATE manutencoes SET
       id_veiculo     = COALESCE($2, id_veiculo),
       tipo_servico   = COALESCE($3, tipo_servico),
       data           = COALESCE($4, data),
       quilometragem  = COALESCE($5, quilometragem),
       custo          = COALESCE($6, custo)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      dto.id_veiculo ?? null,
      dto.tipo_servico ?? null,
      dto.data ?? null,
      dto.quilometragem ?? null,
      dto.custo ?? null,
    ]
  )
  return rows[0] ?? null
}

export async function removeManutencao(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM manutencoes WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}

// Relatório: total de despesas acumuladas por veículo
export interface DespesaPorVeiculo {
  id_veiculo: number
  placa: string
  total_gasto: number
  quantidade_manutencoes: number
}

export async function relatorioDespesasPorVeiculo(): Promise<DespesaPorVeiculo[]> {
  const { rows } = await pool.query<DespesaPorVeiculo>(
    `SELECT
       v.id AS id_veiculo,
       v.placa,
       COALESCE(SUM(m.custo), 0) AS total_gasto,
       COUNT(m.id) AS quantidade_manutencoes
     FROM veiculos v
     LEFT JOIN manutencoes m ON m.id_veiculo = v.id
     GROUP BY v.id, v.placa
     ORDER BY total_gasto DESC`
  )
  return rows
}