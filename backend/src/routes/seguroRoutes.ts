import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/seguroRepository.js';

const router = Router();

// GET /api/seguros
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/seguros/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const data = await repo.findById(id);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Seguro não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/seguros
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, descricao_cobertura, valor_diario } = req.body;
    if (!nome) {
      res.status(400).json({ status: 'error', message: 'Campo "nome" é obrigatório' });
      return;
    }
    if (!descricao_cobertura) {
      res.status(400).json({ status: 'error', message: 'Campo "descricao_cobertura" é obrigatório' });
      return;
    }
    if (valor_diario === undefined || valor_diario === null) {
      res.status(400).json({ status: 'error', message: 'Campo "valor_diario" é obrigatório' });
      return;
    }
    const data = await repo.create({ nome, descricao_cobertura, valor_diario });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/seguros/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const { nome, descricao_cobertura, valor_diario } = req.body;
    if (!nome) {
      res.status(400).json({ status: 'error', message: 'Campo "nome" é obrigatório' });
      return;
    }
    if (!descricao_cobertura) {
      res.status(400).json({ status: 'error', message: 'Campo "descricao_cobertura" é obrigatório' });
      return;
    }
    if (valor_diario === undefined || valor_diario === null) {
      res.status(400).json({ status: 'error', message: 'Campo "valor_diario" é obrigatório' });
      return;
    }
    const data = await repo.update(id, { nome, descricao_cobertura, valor_diario });
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Seguro não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

const checkGerente = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers['x-user-role'];
  if (role !== 'gerente') {
    res.status(403).json({ status: 'error', message: 'Acesso negado. Apenas gerentes podem realizar ações administrativas.' });
    return;
  }
  next();
};

// DELETE /api/seguros/:id
router.delete('/:id', checkGerente, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const deleted = await repo.remove(id);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Seguro não encontrado' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
