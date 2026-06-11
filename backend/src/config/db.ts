import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;
const isPlaceholder = !dbUrl || 
  dbUrl.includes('SUA_SENHA_AQUI') || 
  dbUrl.includes('SEU_PROJECT_ID_AQUI') || 
  dbUrl.includes('COLE_SUA_CONNECTION_STRING_AQUI') ||
  (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'));

let pool: any;

if (isPlaceholder) {
  console.log('⚠️  Aviso: DATABASE_URL não configurada ou contém placeholders. Defina uma URL válida no arquivo backend/.env');
  // Cria um pool vazio/mock para não quebrar a importação, mas qualquer query falhará
  pool = new Pool({
    connectionString: 'postgresql://localhost:5432/postgres'
  });
} else {
  pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined
  });

  // Teste rápido de conexão ao inicializar
  try {
    pool.query('SELECT NOW()', (err: any, res: any) => {
      if (err) {
        console.error('❌ Erro de conexão com o PostgreSQL/Supabase:', err.message);
      } else {
        console.log('✅ Conexão com o PostgreSQL/Supabase estabelecida em:', res.rows[0].now);
      }
    });
  } catch (err: any) {
    console.error('❌ Falha ao tentar conectar ao banco de dados:', err.message);
  }
}

export default pool;
