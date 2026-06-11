import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/locacaoRepository.js';
import * as veiculoRepo from '../repositories/veiculoRepository.js';

const router = Router();

// GET /api/locacoes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/locacoes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const data = await repo.findById(id);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Locação não encontrada' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/locacoes
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      cpf_cliente, placa_veiculo, id_func_registro,
      id_seguro, data_devol_prevista
    } = req.body;

    // Validação das 5 FKs obrigatórias + data de devolução prevista
    const required: Record<string, unknown> = {
      cpf_cliente, placa_veiculo, id_func_registro, id_seguro, data_devol_prevista
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    // Verificar se já existe uma locação ativa ou reservada para este veículo
    const activeLocs = await repo.findActiveOrReservedByPlaca(placa_veiculo);
    if (activeLocs.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Este veículo já possui uma reserva ou locação ativa.'
      });
      return;
    }

    const veiculo = await veiculoRepo.findByPlaca(placa_veiculo);
    if (!veiculo || veiculo.status !== 'disponivel') {
      res.status(400).json({
        status: 'error',
        message: 'O veículo selecionado não está disponível para locação.'
      });
      return;
    }

    const data = await repo.create({
      cpf_cliente,
      placa_veiculo,
      id_func_registro,
      id_func_autoriza: req.body.id_func_autoriza || null,
      id_seguro,
      status: req.body.status ?? 'reservada',
      data_reserva: req.body.data_reserva || new Date().toISOString(),
      data_retirada: req.body.data_retirada || null,
      data_devol_prevista,
      data_devol_real: req.body.data_devol_real || null,
      valor_total: req.body.valor_total || null
    });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/locacoes/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }

    const {
      cpf_cliente, placa_veiculo, id_func_registro,
      id_seguro, status, data_reserva, data_devol_prevista
    } = req.body;

    const required: Record<string, unknown> = {
      cpf_cliente, placa_veiculo, id_func_registro,
      id_seguro, status, data_reserva, data_devol_prevista
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === '') {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const oldLoc = await repo.findById(id);
    if (!oldLoc) {
      res.status(404).json({ status: 'error', message: 'Locação não encontrada' });
      return;
    }

    if (status === 'ativa' && oldLoc.status !== 'ativa') {
      const activeLocs = await repo.findActiveOrReservedByPlaca(placa_veiculo);
      const otherActive = activeLocs.filter(l => l.id_loc !== id && l.status === 'ativa');
      if (otherActive.length > 0) {
        res.status(400).json({
          status: 'error',
          message: 'Este veículo já está em uso em outra locação ativa.'
        });
        return;
      }

      const veiculo = await veiculoRepo.findByPlaca(placa_veiculo);
      if (!veiculo || veiculo.status === 'locado' || veiculo.status === 'em_manutencao' || veiculo.status === 'inativo') {
        res.status(400).json({
          status: 'error',
          message: 'O veículo selecionado já está locado ou indisponível no momento.'
        });
        return;
      }
    }

    const data = await repo.update(id, {
      cpf_cliente,
      placa_veiculo,
      id_func_registro,
      id_func_autoriza: req.body.id_func_autoriza || null,
      id_seguro,
      status,
      data_reserva,
      data_retirada: req.body.data_retirada || null,
      data_devol_prevista,
      data_devol_real: req.body.data_devol_real || null,
      valor_total: req.body.valor_total || null
    });
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Locação não encontrada' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/locacoes/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'ID inválido' });
      return;
    }
    const deleted = await repo.remove(id);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Locação não encontrada' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
