import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle instance with our schema
export const db = drizzle(pool, { schema });

// Helper function to test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Database connection successful");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}