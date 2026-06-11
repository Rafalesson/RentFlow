import pool from '../config/db.js';
import { Categoria } from '../types/index.js';

export async function findAll(): Promise<Categoria[]> {
  const result = await pool.query('SELECT * FROM CATEGORIAS ORDER BY id_cat');
  return result.rows;
}

export async function findById(id: number): Promise<Categoria | null> {
  const result = await pool.query('SELECT * FROM CATEGORIAS WHERE id_cat = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Categoria, 'id_cat'>): Promise<Categoria> {
  const result = await pool.query(
    'INSERT INTO CATEGORIAS (nome, valor_diaria) VALUES ($1, $2) RETURNING *',
    [data.nome, data.valor_diaria]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Categoria, 'id_cat'>): Promise<Categoria | null> {
  const result = await pool.query(
    'UPDATE CATEGORIAS SET nome = $1, valor_diaria = $2 WHERE id_cat = $3 RETURNING *',
    [data.nome, data.valor_diaria, id]
  );
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM CATEGORIAS WHERE id_cat = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
