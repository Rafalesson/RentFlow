import pool from '../config/db.js';
import { Seguro } from '../types/index.js';

export async function findAll(): Promise<Seguro[]> {
  const result = await pool.query('SELECT * FROM SEGUROS ORDER BY id_seguro');
  return result.rows;
}

export async function findById(id: number): Promise<Seguro | null> {
  const result = await pool.query('SELECT * FROM SEGUROS WHERE id_seguro = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Seguro, 'id_seguro'>): Promise<Seguro> {
  const result = await pool.query(
    'INSERT INTO SEGUROS (nome, descricao_cobertura, valor_diario) VALUES ($1, $2, $3) RETURNING *',
    [data.nome, data.descricao_cobertura, data.valor_diario]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Seguro, 'id_seguro'>): Promise<Seguro | null> {
  const result = await pool.query(
    'UPDATE SEGUROS SET nome = $1, descricao_cobertura = $2, valor_diario = $3 WHERE id_seguro = $4 RETURNING *',
    [data.nome, data.descricao_cobertura, data.valor_diario, id]
  );
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM SEGUROS WHERE id_seguro = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
