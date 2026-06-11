import pool from '../config/db.js';
import { Veiculo } from '../types/index.js';

export async function findAll(): Promise<Veiculo[]> {
  const result = await pool.query('SELECT * FROM VEICULOS ORDER BY placa');
  return result.rows;
}

export async function findByPlaca(placa: string): Promise<Veiculo | null> {
  const result = await pool.query('SELECT * FROM VEICULOS WHERE placa = $1', [placa]);
  return result.rows[0] || null;
}

export async function create(data: Veiculo): Promise<Veiculo> {
  const result = await pool.query(
    `INSERT INTO VEICULOS (
      placa, id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel, km_atual, nivel_combustivel, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      data.placa, data.id_cat, data.renavam, data.marca, data.modelo, data.cor,
      data.ano_fabricacao, data.tipo_combustivel, data.km_atual ?? 0,
      data.nivel_combustivel ?? 100, data.status ?? 'disponivel'
    ]
  );
  return result.rows[0];
}

export async function update(placa: string, data: Omit<Veiculo, 'placa'>): Promise<Veiculo | null> {
  const result = await pool.query(
    `UPDATE VEICULOS SET
      id_cat = $1, renavam = $2, marca = $3, modelo = $4, cor = $5,
      ano_fabricacao = $6, tipo_combustivel = $7, km_atual = $8,
      nivel_combustivel = $9, status = $10
    WHERE placa = $11 RETURNING *`,
    [
      data.id_cat, data.renavam, data.marca, data.modelo, data.cor,
      data.ano_fabricacao, data.tipo_combustivel, data.km_atual,
      data.nivel_combustivel, data.status, placa
    ]
  );
  return result.rows[0] || null;
}

export async function remove(placa: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM VEICULOS WHERE placa = $1', [placa]);
  return (result.rowCount ?? 0) > 0;
}
