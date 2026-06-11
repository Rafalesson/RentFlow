import pool from '../config/db.js';
import { Vistoria } from '../types/index.js';

export async function findAll(): Promise<Vistoria[]> {
  const result = await pool.query('SELECT * FROM VISTORIAS ORDER BY id_vistoria DESC');
  return result.rows;
}

export async function findById(id: number): Promise<Vistoria | null> {
  const result = await pool.query('SELECT * FROM VISTORIAS WHERE id_vistoria = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Vistoria, 'id_vistoria'>): Promise<Vistoria> {
  const result = await pool.query(
    `INSERT INTO VISTORIAS (
      id_loc, id_func, tipo, data_hora, km, nivel_combustivel, observacoes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.id_loc, data.id_func, data.tipo,
      data.data_hora || new Date().toISOString(),
      data.km, data.nivel_combustivel, data.observacoes || null
    ]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Vistoria, 'id_vistoria'>): Promise<Vistoria | null> {
  const result = await pool.query(
    `UPDATE VISTORIAS SET
      id_loc = $1, id_func = $2, tipo = $3, data_hora = $4,
      km = $5, nivel_combustivel = $6, observacoes = $7
    WHERE id_vistoria = $8 RETURNING *`,
    [
      data.id_loc, data.id_func, data.tipo, data.data_hora,
      data.km, data.nivel_combustivel, data.observacoes || null, id
    ]
  );
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM VISTORIAS WHERE id_vistoria = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
