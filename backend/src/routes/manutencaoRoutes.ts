import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/manutencaoRepository.js';

const router = Router();

// GET /api/manutencoes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/manutencoes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const data = await repo.findById(id);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Manutenção não encontrada' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/manutencoes
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { placa_veiculo, id_func, tipo, motivo, previsao_saida } = req.body;

    const required: Record<string, unknown> = {
      placa_veiculo, id_func, tipo, motivo, previsao_saida
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.create({
      placa_veiculo, id_func, tipo, motivo,
      descricao: req.body.descricao || null,
      data_entrada: req.body.data_entrada || new Date().toISOString().split('T')[0],
      previsao_saida,
      data_saida_real: req.body.data_saida_real || null,
      custo: req.body.custo || null
    });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/manutencoes/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Manutenção não encontrada' });
      return;
    }

    const placa_veiculo = req.body.placa_veiculo !== undefined ? req.body.placa_veiculo : existing.placa_veiculo;
    const id_func = req.body.id_func !== undefined ? req.body.id_func : existing.id_func;
    const tipo = req.body.tipo !== undefined ? req.body.tipo : existing.tipo;
    const motivo = req.body.motivo !== undefined ? req.body.motivo : existing.motivo;
    const data_entrada = req.body.data_entrada !== undefined ? req.body.data_entrada : existing.data_entrada;
    const previsao_saida = req.body.previsao_saida !== undefined ? req.body.previsao_saida : existing.previsao_saida;

    const required: Record<string, unknown> = {
      placa_veiculo, id_func, tipo, motivo, data_entrada, previsao_saida
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.update(id, {
      placa_veiculo, id_func, tipo, motivo,
      descricao: req.body.descricao !== undefined ? req.body.descricao : existing.descricao,
      data_entrada, previsao_saida,
      data_saida_real: req.body.data_saida_real !== undefined ? req.body.data_saida_real : existing.data_saida_real,
      custo: req.body.custo !== undefined ? req.body.custo : existing.custo
    });
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Manutenção não encontrada' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/manutencoes/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const deleted = await repo.remove(id);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Manutenção não encontrada' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
