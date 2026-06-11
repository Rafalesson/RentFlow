import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/vistoriaRepository.js';

const router = Router();

// GET /api/vistorias
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/vistorias/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const data = await repo.findById(id);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Vistoria não encontrada' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/vistorias
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_loc, id_func, tipo, km, nivel_combustivel } = req.body;

    const required: Record<string, unknown> = { id_loc, id_func, tipo, km, nivel_combustivel };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.create({
      id_loc, id_func, tipo,
      data_hora: req.body.data_hora || new Date().toISOString(),
      km, nivel_combustivel,
      observacoes: req.body.observacoes || null
    });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/vistorias/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }

    const { id_loc, id_func, tipo, data_hora, km, nivel_combustivel } = req.body;

    const required: Record<string, unknown> = { id_loc, id_func, tipo, data_hora, km, nivel_combustivel };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.update(id, {
      id_loc, id_func, tipo, data_hora, km, nivel_combustivel,
      observacoes: req.body.observacoes || null
    });
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Vistoria não encontrada' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/vistorias/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const deleted = await repo.remove(id);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Vistoria não encontrada' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
