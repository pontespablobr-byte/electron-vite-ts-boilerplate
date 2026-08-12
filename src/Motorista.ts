import { pool } from './db'

export interface Motorista {
  id?: number
  nome: string
  cnh: string
  telefone: string
}

export type CriarMotoristaDto = Omit<Motorista, 'id'>
export type AtualizarMotoristaDto = Partial<CriarMotoristaDto>

export async function findAllMotoristas(): Promise<Motorista[]> {
  const { rows } = await pool.query<Motorista>(
    'SELECT * FROM motoristas ORDER BY nome'
  )
  return rows
}

export async function findOneMotorista(id: number): Promise<Motorista | null> {
  const { rows } = await pool.query<Motorista>(
    'SELECT * FROM motoristas WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function findByCnh(cnh: string): Promise<Motorista | null> {
  const { rows } = await pool.query<Motorista>(
    'SELECT * FROM motoristas WHERE cnh = $1',
    [cnh]
  )
  return rows[0] ?? null
}

export async function createMotorista(dto: CriarMotoristaDto): Promise<Motorista> {
  const { rows } = await pool.query<Motorista>(
    `INSERT INTO motoristas (nome, cnh, telefone)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [dto.nome, dto.cnh, dto.telefone]
  )
  return rows[0]
}

export async function updateMotorista(
  id: number,
  dto: AtualizarMotoristaDto
): Promise<Motorista | null> {
  const { rows } = await pool.query<Motorista>(
    `UPDATE motoristas SET
       nome     = COALESCE($2, nome),
       cnh      = COALESCE($3, cnh),
       telefone = COALESCE($4, telefone)
     WHERE id = $1
     RETURNING *`,
    [id, dto.nome ?? null, dto.cnh ?? null, dto.telefone ?? null]
  )
  return rows[0] ?? null
}

export async function removeMotorista(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM motoristas WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}