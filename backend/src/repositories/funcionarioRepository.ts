import pool from '../config/db.js';
import { Funcionario } from '../types/index.js';

export async function findAll(): Promise<Funcionario[]> {
  const result = await pool.query('SELECT id_func, nome, cpf, cargo, email, login, foto_perfil FROM FUNCIONARIOS ORDER BY id_func');
  return result.rows;
}

export async function findById(id: number): Promise<Funcionario | null> {
  const result = await pool.query('SELECT id_func, nome, cpf, cargo, email, login, foto_perfil FROM FUNCIONARIOS WHERE id_func = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Funcionario, 'id_func'>): Promise<Funcionario> {
  const result = await pool.query(
    'INSERT INTO FUNCIONARIOS (nome, cpf, cargo, email, login, senha, foto_perfil) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_func, nome, cpf, cargo, email, login, foto_perfil',
    [data.nome, data.cpf, data.cargo, data.email, data.login, data.senha, data.foto_perfil || null]
  );
  return result.rows[0];
}

export async function update(id: number, data: Omit<Funcionario, 'id_func'>): Promise<Funcionario | null> {
  let query: string;
  let params: any[];

  if (data.senha) {
    query = 'UPDATE FUNCIONARIOS SET nome = $1, cpf = $2, cargo = $3, email = $4, login = $5, senha = $6, foto_perfil = $7 WHERE id_func = $8 RETURNING id_func, nome, cpf, cargo, email, login, foto_perfil';
    params = [data.nome, data.cpf, data.cargo, data.email, data.login, data.senha, data.foto_perfil !== undefined ? data.foto_perfil : null, id];
  } else {
    query = 'UPDATE FUNCIONARIOS SET nome = $1, cpf = $2, cargo = $3, email = $4, login = $5, foto_perfil = $6 WHERE id_func = $7 RETURNING id_func, nome, cpf, cargo, email, login, foto_perfil';
    params = [data.nome, data.cpf, data.cargo, data.email, data.login, data.foto_perfil !== undefined ? data.foto_perfil : null, id];
  }

  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM FUNCIONARIOS WHERE id_func = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function findByLoginOrEmailOrCpf(identifier: string): Promise<Funcionario | null> {
  const rawCpf = identifier.replace(/\D/g, ''); // Extrai apenas números para comparação flexível de CPF
  const result = await pool.query(
    `SELECT * FROM FUNCIONARIOS 
     WHERE login = $1 
        OR email = $1 
        OR cpf = $1 
        OR REPLACE(REPLACE(cpf, '.', ''), '-', '') = $2`,
    [identifier, rawCpf]
  );
  return result.rows[0] || null;
}

export async function checkLoginExists(login: string): Promise<boolean> {
  const result = await pool.query('SELECT 1 FROM FUNCIONARIOS WHERE login = $1', [login]);
  return (result.rowCount ?? 0) > 0;
}
