import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as repo from '../repositories/funcionarioRepository.js';
import { generateBaseSuggestions } from './authRoutes.js';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware de verificação de permissão de Gerente
const checkGerente = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers['x-user-role'];
  if (role !== 'gerente') {
    res.status(403).json({ status: 'error', message: 'Acesso negado. Apenas gerentes podem realizar ações administrativas.' });
    return;
  }
  next();
};

// GET /api/funcionarios
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/funcionarios/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const data = await repo.findById(id);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Funcionário não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/funcionarios
router.post('/', checkGerente, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, cpf, cargo, email, login, senha } = req.body;
    if (!nome) {
      res.status(400).json({ status: 'error', message: 'Campo "nome" é obrigatório' });
      return;
    }
    if (!cpf) {
      res.status(400).json({ status: 'error', message: 'Campo "cpf" é obrigatório' });
      return;
    }
    if (!cargo) {
      res.status(400).json({ status: 'error', message: 'Campo "cargo" é obrigatório' });
      return;
    }
    if (!email) {
      res.status(400).json({ status: 'error', message: 'Campo "email" é obrigatório' });
      return;
    }

    // Gerar login automático se não fornecido
    let finalLogin = login;
    if (!finalLogin) {
      const baseSuggestions = generateBaseSuggestions(nome);
      if (baseSuggestions.length > 0) {
        for (const sug of baseSuggestions) {
          const exists = await repo.checkLoginExists(sug);
          if (!exists) {
            finalLogin = sug;
            break;
          }
        }
        if (!finalLogin) {
          const primaryBase = baseSuggestions[0];
          let counter = 1;
          while (true) {
            const candidate = `${primaryBase}${counter}`;
            const exists = await repo.checkLoginExists(candidate);
            if (!exists) {
              finalLogin = candidate;
              break;
            }
            counter++;
          }
        }
      } else {
        finalLogin = nome.toLowerCase().replace(/\s+/g, '');
      }
    }

    const defaultSenha = senha ? hashPassword(senha) : hashPassword('senha123');

    const data = await repo.create({
      nome,
      cpf,
      cargo,
      email,
      login: finalLogin,
      senha: defaultSenha
    });

    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/funcionarios/:id
router.put('/:id', checkGerente, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const { nome, cpf, cargo, email, login, senha } = req.body;
    if (!nome || !cpf || !cargo || !email || !login) {
      res.status(400).json({ status: 'error', message: 'Campos nome, cpf, cargo, email e login são obrigatórios' });
      return;
    }

    const updatePayload: any = { nome, cpf, cargo, email, login };
    if (senha) {
      updatePayload.senha = hashPassword(senha);
    }

    const data = await repo.update(id, updatePayload);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Funcionário não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/funcionarios/:id
router.delete('/:id', checkGerente, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const deleted = await repo.remove(id);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Funcionário não encontrado' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
