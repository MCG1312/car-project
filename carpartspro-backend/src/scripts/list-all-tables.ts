import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function listAllTables() {
  console.log("🕵️‍♂️ Scan complet de la base de données...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log("\n📋 LISTE DES TABLES :")
    // On affiche tout pour trouver la bonne table de règles de prix
    tables.rows.forEach(row => console.log(row.table_name))

  } catch (error) {
    console.error("❌ Erreur :", error)
  } finally {
    await client.end()
  }
}