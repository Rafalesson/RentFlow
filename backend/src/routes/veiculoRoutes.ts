import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/veiculoRepository.js';

const router = Router();

// GET /api/veiculos
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/veiculos/:placa
router.get('/:placa', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findByPlaca(req.params.placa);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Veículo não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/veiculos
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      placa, id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel
    } = req.body;

    const required: Record<string, unknown> = {
      placa, id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.create({
      placa, id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel,
      km_atual: req.body.km_atual ?? 0,
      nivel_combustivel: req.body.nivel_combustivel ?? 100,
      status: req.body.status ?? 'disponivel'
    });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/veiculos/:placa
router.put('/:placa', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel, km_atual, nivel_combustivel, status
    } = req.body;

    const required: Record<string, unknown> = {
      id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel, km_atual, nivel_combustivel, status
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.update(req.params.placa, {
      id_cat, renavam, marca, modelo, cor,
      ano_fabricacao, tipo_combustivel, km_atual, nivel_combustivel, status
    });
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Veículo não encontrado' });
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

// DELETE /api/veiculos/:placa
router.delete('/:placa', checkGerente, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await repo.remove(req.params.placa);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Veículo não encontrado' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
