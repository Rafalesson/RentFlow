// =============================================================================
// RentFlow — TypeScript Types & Enums
// Mapeamento direto do schema.sql PostgreSQL
// =============================================================================

// --- ENUM Union Types (espelham os CREATE TYPE do schema) ---

export type StatusVeiculo = 'disponivel' | 'locado' | 'em_manutencao' | 'inativo';
export type StatusLocacao = 'reservada' | 'ativa' | 'encerrada' | 'cancelada';
export type TipoCombustivel = 'gasolina' | 'etanol' | 'flex' | 'diesel' | 'eletrico';
export type TipoVistoria = 'retirada' | 'devolucao';
export type CargoFuncionario = 'atendente' | 'gerente';
export type TipoCobranca = 'avaria' | 'combustivel' | 'multa' | 'outros';
export type TipoManutencao = 'preventiva' | 'corretiva';
export type FormaPagamento = 'dinheiro' | 'credito' | 'debito' | 'pix';
export type CategoriaCnh = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE';

// --- Interfaces de Entidades (espelham as tabelas do schema) ---

// Nível 0 — sem dependências externas

export interface Categoria {
  id_cat: number;
  nome: string;
  valor_diaria: number;
}

export interface Cliente {
  cpf: string;
  nome: string;
  data_nascimento: string; // DATE → ISO string
  email: string;
  inadimplente: boolean;
  cnh_numero: string;
  cnh_categoria: CategoriaCnh;
  cnh_validade: string; // DATE → ISO string
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep: string;
}

export interface Funcionario {
  id_func: number;
  nome: string;
  cpf: string;
  cargo: CargoFuncionario;
  email: string;
  login: string;
  senha?: string;
  foto_perfil?: string | null;
}

export interface Seguro {
  id_seguro: number;
  nome: string;
  descricao_cobertura: string;
  valor_diario: number;
}

// Nível 1 — dependem de nível 0

export interface Veiculo {
  placa: string;
  id_cat: number;
  renavam: string;
  marca: string;
  modelo: string;
  cor: string;
  ano_fabricacao: number;
  tipo_combustivel: TipoCombustivel;
  km_atual: number;
  nivel_combustivel: number;
  status: StatusVeiculo;
}

// Nível 2 — dependem de nível 0 e 1

export interface Locacao {
  id_loc: number;
  cpf_cliente: string;
  placa_veiculo: string;
  id_func_registro: number;
  id_func_autoriza: number | null;
  id_seguro: number;
  status: StatusLocacao;
  data_reserva: string; // TIMESTAMPTZ → ISO string
  data_retirada: string | null;
  data_devol_prevista: string;
  data_devol_real: string | null;
  valor_total: number | null;
}

// Nível 3 — dependem de LOCACOES

export interface Vistoria {
  id_vistoria: number;
  id_loc: number;
  id_func: number;
  tipo: TipoVistoria;
  data_hora: string; // TIMESTAMPTZ → ISO string
  km: number;
  nivel_combustivel: number;
  observacoes: string | null;
}

export interface Pagamento {
  id_pagamento: number;
  id_loc: number;
  forma_pagamento: FormaPagamento;
  valor: number;
  data: string; // TIMESTAMPTZ → ISO string
}

export interface Manutencao {
  id_manut: number;
  placa_veiculo: string;
  id_func: number;
  tipo: TipoManutencao;
  motivo: string;
  descricao: string | null;
  data_entrada: string; // DATE → ISO string
  previsao_saida: string;
  data_saida_real: string | null;
  custo: number | null;
}
