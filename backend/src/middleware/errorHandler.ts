import { Request, Response, NextFunction } from 'express';

// Códigos de erro de restrição do PostgreSQL
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_UNIQUE_VIOLATION = '23505';
const PG_CHECK_VIOLATION = '23514';
const PG_INVALID_DATETIME_FORMAT = '22007';
const PG_INVALID_TEXT_REPRESENTATION = '22P02';

// Mapeamento de nomes de constraint para mensagens amigáveis
const CONSTRAINT_MESSAGES: Record<string, string> = {
  // UNIQUE constraints
  clientes_pkey: 'CPF já cadastrado',
  clientes_email_key: 'Email já cadastrado',
  clientes_cnh_numero_key: 'Número de CNH já cadastrado',
  funcionarios_cpf_key: 'CPF de funcionário já cadastrado',
  veiculos_renavam_key: 'RENAVAM já cadastrado',

  // CHECK constraints
  categorias_valor_diaria_check: 'Valor da diária deve ser maior que zero',
  chk_clientes_cnh_validade: 'Validade da CNH deve ser posterior à data de nascimento',
  veiculos_ano_fabricacao_check: 'Ano de fabricação inválido',
  veiculos_km_atual_check: 'Quilometragem não pode ser negativa',
  veiculos_nivel_combustivel_check: 'Nível de combustível deve estar entre 0 e 100',
  chk_locacoes_devolucao: 'Data de devolução real deve ser posterior à data de retirada',
  chk_locacoes_previsao: 'Data de devolução prevista deve ser posterior à data de reserva',
  chk_locacoes_valor_total: 'Valor total não pode ser negativo',
  vistorias_km_check: 'Quilometragem não pode ser negativa',
  vistorias_nivel_combustivel_check: 'Nível de combustível deve estar entre 0 e 100',
  pagamentos_valor_check: 'Valor do pagamento deve ser maior que zero',
  cobrancas_extras_valor_check: 'Valor da cobrança deve ser maior que zero',
  chk_manutencoes_previsao: 'Data de previsão de saída deve ser posterior ou igual à data de entrada',
  chk_manutencoes_saida_real: 'Data de saída real deve ser posterior ou igual à data de entrada',
};

// Mapeamento de FK para mensagens amigáveis (baseado no nome da tabela referenciada)
const FK_MESSAGES: Record<string, string> = {
  categorias: 'Categoria não encontrada',
  clientes: 'Cliente não encontrado',
  funcionarios: 'Funcionário não encontrado',
  seguros: 'Seguro não encontrado',
  veiculos: 'Veículo não encontrado',
  locacoes: 'Locação não encontrada',
  vistorias: 'Vistoria não encontrada',
};

interface PgError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
}

export function pgErrorHandler(err: PgError, req: Request, res: Response, next: NextFunction): void {
  // Se não for erro do PostgreSQL, passar adiante
  if (!err.code) {
    next(err);
    return;
  }

  switch (err.code) {
    case PG_UNIQUE_VIOLATION: {
      const message = (err.constraint && CONSTRAINT_MESSAGES[err.constraint])
        || 'Registro duplicado — já existe um registro com esses dados';
      res.status(409).json({ status: 'error', message });
      return;
    }

    case PG_FOREIGN_KEY_VIOLATION: {
      // Tentar extrair a tabela referenciada do detail do erro
      const refMatch = err.detail?.match(/is not present in table "(\w+)"/i)
        || err.detail?.match(/is still referenced from table "(\w+)"/i);
      const refTable = refMatch?.[1]?.toLowerCase();

      // Se é uma tentativa de DELETE com dependências
      if (err.detail?.includes('still referenced')) {
        const message = `Não é possível excluir — existem registros dependentes em ${refTable || 'outra tabela'}`;
        res.status(409).json({ status: 'error', message });
        return;
      }

      // FK não encontrada no INSERT/UPDATE
      const message = (refTable && FK_MESSAGES[refTable])
        || 'Referência inválida — registro relacionado não encontrado';
      res.status(400).json({ status: 'error', message });
      return;
    }

    case PG_CHECK_VIOLATION: {
      const message = (err.constraint && CONSTRAINT_MESSAGES[err.constraint])
        || 'Valor inválido — não atende às restrições do campo';
      res.status(400).json({ status: 'error', message });
      return;
    }

    case PG_INVALID_DATETIME_FORMAT:
    case PG_INVALID_TEXT_REPRESENTATION: {
      res.status(400).json({ status: 'error', message: 'Sintaxe de dados inválida — verifique se números, datas e opções estão no formato correto' });
      return;
    }

    default:
      next(err);
  }
}
