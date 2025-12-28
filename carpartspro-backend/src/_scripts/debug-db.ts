import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function debugDb() {
  console.log("🕵️‍♂️ Enquête sur la base de données...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // 1. Lister toutes les tables qui commencent par "store"
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'store%'
    `)

    console.log("\n📋 TABLES TROUVÉES :")
    tables.rows.forEach(row => console.log(`- ${row.table_name}`))

    // 2. Voir les colonnes de la table "store"
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'store'
    `)

    console.log("\n📋 COLONNES DE LA TABLE 'STORE' :")
    columns.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`))

  } catch (error) {
    console.error("❌ Erreur :", error)
  } finally {
    await client.end()
  }
}