import pool from '../config/db.js';
import { Pagamento } from '../types/index.js';

export async function findAll(): Promise<Pagamento[]> {
  const result = await pool.query('SELECT * FROM PAGAMENTOS ORDER BY id_pagamento DESC');
  return result.rows;
}

export async function findById(id: number): Promise<Pagamento | null> {
  const result = await pool.query('SELECT * FROM PAGAMENTOS WHERE id_pagamento = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Pagamento, 'id_pagamento'>): Promise<Pagamento> {
  const result = await pool.query(
    `INSERT INTO PAGAMENTOS (id_loc, forma_pagamento, valor, data)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.id_loc, data.forma_pagamento, data.valor, data.data || new Date().toISOString()]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Pagamento, 'id_pagamento'>): Promise<Pagamento | null> {
  const result = await pool.query(
    `UPDATE PAGAMENTOS SET id_loc = $1, forma_pagamento = $2, valor = $3, data = $4
     WHERE id_pagamento = $5 RETURNING *`,
    [data.id_loc, data.forma_pagamento, data.valor, data.data, id]
  );
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM PAGAMENTOS WHERE id_pagamento = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
