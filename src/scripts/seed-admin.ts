import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Seeding admin user...");

  const username = process.env.ADMIN_USERNAME || "admin";
  const plainPassword = process.env.ADMIN_PASSWORD || "admin123";

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  try {
    await db.insert(users).values({
      username,
      passwordHash,
    });
    console.log(`Admin user created: ${username}`);
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      console.log(`Admin user '${username}' already exists.`);
    } else {
      console.error("Error creating admin user:", error);
    }
  }

  await pool.end();
}

main().catch(console.error);
