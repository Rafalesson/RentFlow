import pool from '../config/db.js';
import { Manutencao } from '../types/index.js';

export async function findAll(): Promise<Manutencao[]> {
  const result = await pool.query('SELECT * FROM MANUTENCOES ORDER BY id_manut DESC');
  return result.rows;
}

export async function findById(id: number): Promise<Manutencao | null> {
  const result = await pool.query('SELECT * FROM MANUTENCOES WHERE id_manut = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Manutencao, 'id_manut'>): Promise<Manutencao> {
  const result = await pool.query(
    `INSERT INTO MANUTENCOES (
      placa_veiculo, id_func, tipo, motivo, descricao,
      data_entrada, previsao_saida, data_saida_real, custo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.placa_veiculo, data.id_func, data.tipo, data.motivo,
      data.descricao || null,
      data.data_entrada || new Date().toISOString().split('T')[0],
      data.previsao_saida,
      data.data_saida_real || null,
      data.custo || null
    ]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Manutencao, 'id_manut'>): Promise<Manutencao | null> {
  const result = await pool.query(
    `UPDATE MANUTENCOES SET
      placa_veiculo = $1, id_func = $2, tipo = $3, motivo = $4,
      descricao = $5, data_entrada = $6, previsao_saida = $7,
      data_saida_real = $8, custo = $9
    WHERE id_manut = $10 RETURNING *`,
    [
      data.placa_veiculo, data.id_func, data.tipo, data.motivo,
      data.descricao || null, data.data_entrada, data.previsao_saida,
      data.data_saida_real || null, data.custo || null, id
    ]
  );
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM MANUTENCOES WHERE id_manut = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
