import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

function generateId() {
  return "stcurr_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export default async function forceMadDirect() {
  console.log("🚀 Force-activation du MAD (Mode Vérification Manuelle)...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // 1. Assurer que le MAD existe
    await client.query(`
      INSERT INTO currency (code, symbol, symbol_native, name, raw_rounding)
      VALUES ('mad', 'MAD', 'DH', 'Moroccan Dirham', '{}')
      ON CONFLICT (code) DO NOTHING;
    `)
    
    // 2. Trouver le Store
    const res = await client.query(`SELECT id FROM store LIMIT 1`)
    const storeId = res.rows[0]?.id
    if (!storeId) throw new Error("Aucun magasin trouvé !")

    // 3. VÉRIFICATION : Est-ce que le lien existe déjà ?
    const check = await client.query(`
      SELECT id FROM store_currency 
      WHERE store_id = $1 AND currency_code = 'mad'
    `, [storeId])

    if (check.rowCount > 0) {
      console.log("✅ Le MAD est DÉJÀ lié au store (Rien à faire).")
    } else {
      // 4. Si ça n'existe pas, on l'insère (SANS "ON CONFLICT")
      const newId = generateId()
      await client.query(`
        INSERT INTO store_currency (id, store_id, currency_code)
        VALUES ($1, $2, 'mad')
      `, [newId, storeId])
      console.log("✅ SUCCÈS : MAD lié au store (Nouvelle ligne insérée).")
    }

    // 5. Tenter de mettre is_default (si la colonne existe)
    try {
      await client.query(`
        UPDATE store_currency SET is_default = true WHERE store_id = $1 AND currency_code = 'mad'
      `, [storeId])
      console.log("✅ Option : MAD défini par défaut.")
    } catch (e) {
      // On ignore silencieusement
    }

    console.log("🎉 CONFIGURATION TERMINÉE.")
    console.log("👉 TAPE MAINTENANT : npx medusa exec ./src/scripts/fix-prices.ts")

  } catch (error) {
    console.error("❌ Erreur :", error)
  } finally {
    await client.end()
  }
}