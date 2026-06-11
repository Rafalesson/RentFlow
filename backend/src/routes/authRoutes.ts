import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as repo from '../repositories/funcionarioRepository.js';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateBaseSuggestions(nomeCompleto: string): string[] {
  const cleaned = nomeCompleto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z\s]/g, '') // remove special characters
    .trim();

  const parts = cleaned.split(/\s+/).filter(
    (part) => !['de', 'da', 'do', 'dos', 'das', 'e'].includes(part)
  );

  if (parts.length === 0) return [];

  const suggestions: string[] = [];
  const first = parts[0];

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    suggestions.push(`${first}.${last}`); // joao.silva
    suggestions.push(`${first}${last}`);  // joaosilva

    if (parts.length > 2) {
      const middle = parts[1];
      suggestions.push(`${first}.${middle}`); // joao.gomes
    }
  } else {
    suggestions.push(first);
  }

  return suggestions;
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ status: 'error', message: 'Identificador e senha são obrigatórios.' });
      return;
    }

    const funcionario = await repo.findByLoginOrEmailOrCpf(identifier);
    if (!funcionario) {
      res.status(401).json({ status: 'error', message: 'Credenciais inválidas.' });
      return;
    }

    // A senha do banco está no objeto funcionario retornado por findByLoginOrEmailOrCpf (que usa SELECT *)
    const storedHash = (funcionario as any).senha;
    const inputHash = hashPassword(password);

    if (storedHash !== inputHash) {
      res.status(401).json({ status: 'error', message: 'Credenciais inválidas.' });
      return;
    }

    // Remove a senha do objeto de resposta
    const { senha, ...userProfile } = funcionario as any;

    res.json({ status: 'ok', data: userProfile });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/suggest-login
router.post('/suggest-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome } = req.body;
    if (!nome) {
      res.status(400).json({ status: 'error', message: 'Campo "nome" é obrigatório.' });
      return;
    }

    const baseSuggestions = generateBaseSuggestions(nome);
    if (baseSuggestions.length === 0) {
      res.status(400).json({ status: 'error', message: 'Nome inválido.' });
      return;
    }

    // Tenta encontrar a primeira sugestão livre
    let chosenSuggestion = '';
    for (const sug of baseSuggestions) {
      const exists = await repo.checkLoginExists(sug);
      if (!exists) {
        chosenSuggestion = sug;
        break;
      }
    }

    // Se todas estiverem ocupadas, adiciona um contador numérico na primeira sugestão
    if (!chosenSuggestion) {
      const primaryBase = baseSuggestions[0]; // e.g. joao.silva
      let counter = 1;
      while (true) {
        const candidate = `${primaryBase}${counter}`;
        const exists = await repo.checkLoginExists(candidate);
        if (!exists) {
          chosenSuggestion = candidate;
          break;
        }
        counter++;
      }
    }

    res.json({ status: 'ok', data: { suggestion: chosenSuggestion } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdHeader = req.headers['x-user-id'];
    if (!userIdHeader) {
      res.status(401).json({ status: 'error', message: 'Usuário não autenticado.' });
      return;
    }

    const id_func = parseInt(userIdHeader as string, 10);
    if (isNaN(id_func)) {
      res.status(400).json({ status: 'error', message: 'ID do usuário inválido.' });
      return;
    }

    // Busca o funcionário atual
    const currentFunc = await repo.findById(id_func);
    if (!currentFunc) {
      res.status(404).json({ status: 'error', message: 'Usuário não encontrado.' });
      return;
    }

    const { nome, email, cpf, senha, senha_antiga, foto_perfil } = req.body;

    if (!nome || !email || !cpf) {
      res.status(400).json({ status: 'error', message: 'Nome, CPF e Email são obrigatórios.' });
      return;
    }

    // Validar se o CPF ou Email está em uso por outro funcionário
    const existing = await repo.findByLoginOrEmailOrCpf(email);
    if (existing && existing.id_func !== id_func) {
      res.status(400).json({ status: 'error', message: 'Este e-mail já está em uso por outro funcionário.' });
      return;
    }

    const existingCpf = await repo.findByLoginOrEmailOrCpf(cpf);
    if (existingCpf && existingCpf.id_func !== id_func) {
      res.status(400).json({ status: 'error', message: 'Este CPF já está em uso por outro funcionário.' });
      return;
    }

    // Montar o payload para atualização no repositório.
    const updatePayload: any = {
      nome,
      cpf,
      cargo: currentFunc.cargo,
      email,
      login: currentFunc.login,
      foto_perfil: foto_perfil !== undefined ? foto_perfil : currentFunc.foto_perfil
    };

    if (senha) {
      if (!senha_antiga) {
        res.status(400).json({ status: 'error', message: 'A senha antiga é obrigatória para alterar a senha.' });
        return;
      }
      
      const funcWithPassword = await repo.findByLoginOrEmailOrCpf(currentFunc.login);
      if (!funcWithPassword) {
        res.status(404).json({ status: 'error', message: 'Usuário não encontrado para validação de senha.' });
        return;
      }
      
      const storedHash = (funcWithPassword as any).senha;
      const inputOldHash = hashPassword(senha_antiga);
      
      if (storedHash !== inputOldHash) {
        res.status(401).json({ status: 'error', message: 'A senha antiga está incorreta.' });
        return;
      }

      updatePayload.senha = hashPassword(senha);
    }

    const updated = await repo.update(id_func, updatePayload);
    if (!updated) {
      res.status(500).json({ status: 'error', message: 'Falha ao atualizar o perfil.' });
      return;
    }

    res.json({ status: 'ok', data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
