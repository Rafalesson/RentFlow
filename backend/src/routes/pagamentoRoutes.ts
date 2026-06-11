import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/pagamentoRepository.js';

const router = Router();

// GET /api/pagamentos
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/pagamentos/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const data = await repo.findById(id);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Pagamento não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/pagamentos
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_loc, forma_pagamento, valor } = req.body;

    if (!id_loc && id_loc !== 0) {
      res.status(400).json({ status: 'error', message: 'Campo "id_loc" é obrigatório' });
      return;
    }
    if (!forma_pagamento) {
      res.status(400).json({ status: 'error', message: 'Campo "forma_pagamento" é obrigatório' });
      return;
    }
    if (valor === undefined || valor === null) {
      res.status(400).json({ status: 'error', message: 'Campo "valor" é obrigatório' });
      return;
    }

    const data = await repo.create({
      id_loc, forma_pagamento, valor,
      data: req.body.data || new Date().toISOString()
    });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/pagamentos/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }

    const { id_loc, forma_pagamento, valor, data: dataPgto } = req.body;

    if (!id_loc && id_loc !== 0) {
      res.status(400).json({ status: 'error', message: 'Campo "id_loc" é obrigatório' });
      return;
    }
    if (!forma_pagamento) {
      res.status(400).json({ status: 'error', message: 'Campo "forma_pagamento" é obrigatório' });
      return;
    }
    if (valor === undefined || valor === null) {
      res.status(400).json({ status: 'error', message: 'Campo "valor" é obrigatório' });
      return;
    }
    if (!dataPgto) {
      res.status(400).json({ status: 'error', message: 'Campo "data" é obrigatório' });
      return;
    }

    const result = await repo.update(id, { id_loc, forma_pagamento, valor, data: dataPgto });
    if (!result) {
      res.status(404).json({ status: 'error', message: 'Pagamento não encontrado' });
      return;
    }
    res.json({ status: 'ok', data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/pagamentos/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const deleted = await repo.remove(id);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Pagamento não encontrado' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
