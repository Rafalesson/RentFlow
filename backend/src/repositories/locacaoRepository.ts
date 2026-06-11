import pool from '../config/db.js';
import { Locacao } from '../types/index.js';

export async function findAll(): Promise<Locacao[]> {
  const result = await pool.query('SELECT * FROM LOCACOES ORDER BY id_loc DESC');
  return result.rows;
}

export async function findById(id: number): Promise<Locacao | null> {
  const result = await pool.query('SELECT * FROM LOCACOES WHERE id_loc = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Locacao, 'id_loc'>): Promise<Locacao> {
  const result = await pool.query(
    `INSERT INTO LOCACOES (
      cpf_cliente, placa_veiculo, id_func_registro, id_func_autoriza,
      id_seguro, status, data_reserva, data_retirada,
      data_devol_prevista, data_devol_real, valor_total
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      data.cpf_cliente, data.placa_veiculo, data.id_func_registro,
      data.id_func_autoriza || null,
      data.id_seguro, data.status ?? 'reservada',
      data.data_reserva || new Date().toISOString(),
      data.data_retirada || null,
      data.data_devol_prevista,
      data.data_devol_real || null,
      data.valor_total || null
    ]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Locacao, 'id_loc'>): Promise<Locacao | null> {
  const result = await pool.query(
    `UPDATE LOCACOES SET
      cpf_cliente = $1, placa_veiculo = $2, id_func_registro = $3,
      id_func_autoriza = $4, id_seguro = $5, status = $6,
      data_reserva = $7, data_retirada = $8,
      data_devol_prevista = $9, data_devol_real = $10, valor_total = $11
    WHERE id_loc = $12 RETURNING *`,
    [
      data.cpf_cliente, data.placa_veiculo, data.id_func_registro,
      data.id_func_autoriza || null,
      data.id_seguro, data.status,
      data.data_reserva, data.data_retirada || null,
      data.data_devol_prevista, data.data_devol_real || null,
      data.valor_total || null, id
    ]
  );
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM LOCACOES WHERE id_loc = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function findActiveOrReservedByPlaca(placa: string): Promise<Locacao[]> {
  const result = await pool.query(
    "SELECT * FROM LOCACOES WHERE placa_veiculo = $1 AND status IN ('reservada', 'ativa')",
    [placa]
  );
  return result.rows;
}
