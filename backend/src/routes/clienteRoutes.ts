import { Router, Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/clienteRepository.js';

const router = Router();

// GET /api/clientes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findAll();
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// GET /api/clientes/:cpf
router.get('/:cpf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await repo.findByCpf(req.params.cpf);
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Cliente não encontrado' });
      return;
    }
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// POST /api/clientes
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      cpf, nome, data_nascimento, email,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    } = req.body;

    // Validação de campos obrigatórios
    const required: Record<string, unknown> = {
      cpf, nome, data_nascimento, email,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    };

    for (const [field, value] of Object.entries(required)) {
      if (!value && value !== false) {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.create({
      cpf, nome, data_nascimento, email,
      inadimplente: req.body.inadimplente ?? false,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    });
    res.status(201).json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/clientes/:cpf
router.put('/:cpf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      nome, data_nascimento, email,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    } = req.body;

    const required: Record<string, unknown> = {
      nome, data_nascimento, email,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    };

    for (const [field, value] of Object.entries(required)) {
      if (!value && value !== false) {
        res.status(400).json({ status: 'error', message: `Campo "${field}" é obrigatório` });
        return;
      }
    }

    const data = await repo.update(req.params.cpf, {
      nome, data_nascimento, email,
      inadimplente: req.body.inadimplente ?? false,
      cnh_numero, cnh_categoria, cnh_validade,
      endereco_rua, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_estado, endereco_cep
    });
    if (!data) {
      res.status(404).json({ status: 'error', message: 'Cliente não encontrado' });
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

// DELETE /api/clientes/:cpf
router.delete('/:cpf', checkGerente, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await repo.remove(req.params.cpf);
    if (!deleted) {
      res.status(404).json({ status: 'error', message: 'Cliente não encontrado' });
      return;
    }
    res.json({ status: 'ok', data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
