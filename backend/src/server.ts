import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

// Importação das rotas
import authRoutes from './routes/authRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import funcionarioRoutes from './routes/funcionarioRoutes.js';
import seguroRoutes from './routes/seguroRoutes.js';
import veiculoRoutes from './routes/veiculoRoutes.js';
import locacaoRoutes from './routes/locacaoRoutes.js';
import vistoriaRoutes from './routes/vistoriaRoutes.js';
import pagamentoRoutes from './routes/pagamentoRoutes.js';
import manutencaoRoutes from './routes/manutencaoRoutes.js';

// Importação do middleware de erro do banco
import { pgErrorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de verificação de integridade e conexão com banco
app.get('/api/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'API do RentFlow está rodando e conectada ao Supabase!',
      dbTime: dbResult.rows[0].now
    });
  } catch (error: any) {
    next(error);
  }
});

// Registro das rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/seguros', seguroRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/locacoes', locacaoRoutes);
app.use('/api/vistorias', vistoriaRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/manutencoes', manutencaoRoutes);

// Middleware de tratamento de erros específico do PostgreSQL
app.use(pgErrorHandler);

// Middleware global para tratamento de erros genéricos (fallback)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro Capturado:', err.message || err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor RentFlow rodando em http://localhost:${PORT}`);
});

