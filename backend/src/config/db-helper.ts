import { pool } from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper para manter compatibilidade com sintaxe PostgreSQL
export const query = async (sql: string, params?: any[]) => {
  try {
    const [result] = await pool.query(sql, params);
    
    // Se for um INSERT/UPDATE/DELETE, retorna ResultSetHeader com insertId
    if ((result as ResultSetHeader).insertId !== undefined) {
      return { 
        rows: [] as any[],
        insertId: (result as ResultSetHeader).insertId,
        affectedRows: (result as ResultSetHeader).affectedRows
      };
    }
    
    // Se for um SELECT, retorna as rows
    return { rows: result as any[] };
  } catch (error) {
    throw error;
  }
};

// Wrapper do pool.query que retorna no formato {rows: []}
export const pool_query = query;

export default { query };
