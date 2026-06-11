import pool from '../config/db.js';
import { Cliente } from '../types/index.js';

export async function findAll(): Promise<Cliente[]> {
  const result = await pool.query('SELECT * FROM CLIENTES ORDER BY nome');
  return result.rows;
}

export async function findByCpf(cpf: string): Promise<Cliente | null> {
  const result = await pool.query('SELECT * FROM CLIENTES WHERE cpf = $1', [cpf]);
  return result.rows[0] || null;
}

export async function create(data: Cliente): Promise<Cliente> {
  const result = await pool.query(
    `INSERT INTO CLIENTES (
      cpf, nome, data_nascimento, email, inadimplente,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      data.cpf, data.nome, data.data_nascimento, data.email, data.inadimplente ?? false,
      data.cnh_numero, data.cnh_categoria, data.cnh_validade,
      data.endereco_rua, data.endereco_numero, data.endereco_bairro,
      data.endereco_cidade, data.endereco_estado, data.endereco_cep
    ]
  );
  return result.rows[0];
}

export async function update(cpf: string, data: Omit<Cliente, 'cpf'>): Promise<Cliente | null> {
  const result = await pool.query(
    `UPDATE CLIENTES SET
      nome = $1, data_nascimento = $2, email = $3, inadimplente = $4,
      cnh_numero = $5, cnh_categoria = $6, cnh_validade = $7,
      endereco_rua = $8, endereco_numero = $9, endereco_bairro = $10,
      endereco_cidade = $11, endereco_estado = $12, endereco_cep = $13
    WHERE cpf = $14 RETURNING *`,
    [
      data.nome, data.data_nascimento, data.email, data.inadimplente,
      data.cnh_numero, data.cnh_categoria, data.cnh_validade,
      data.endereco_rua, data.endereco_numero, data.endereco_bairro,
      data.endereco_cidade, data.endereco_estado, data.endereco_cep,
      cpf
    ]
  );
  return result.rows[0] || null;
}

export async function remove(cpf: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM CLIENTES WHERE cpf = $1', [cpf]);
  return (result.rowCount ?? 0) > 0;
}
