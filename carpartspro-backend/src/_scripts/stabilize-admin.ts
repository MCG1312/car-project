import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

function generateId() {
  return "link_" + Math.random().toString(36).substring(2, 15)
}

export default async function stabilizeAdmin() {
  console.log("🚀 Stabilisation de l'Admin Panel...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // 1. Récupérer le Store
    const resStore = await client.query(`SELECT id FROM store LIMIT 1`)
    const storeId = resStore.rows[0]?.id
    if (!storeId) throw new Error("Store introuvable")

    console.log(`ℹ️ Store ID: ${storeId}`)

    // 2. Récupérer la Région Maroc
    const resReg = await client.query(`SELECT id FROM region WHERE currency_code = 'mad' LIMIT 1`)
    const regionId = resReg.rows[0]?.id

    if (regionId) {
      // 3. Définir la région par défaut (Aide l'UI à ne pas planter)
      await client.query(`UPDATE store SET default_region_id = $1 WHERE id = $2`, [regionId, storeId])
      console.log("✅ Région par défaut définie sur : Maroc")
    }

    // 4. Lier EUR et USD au Store (pour que les préférences ne tournent pas dans le vide)
    // On s'assure d'abord qu'elles existent dans la table currency
    await client.query(`
      INSERT INTO currency (code, symbol, symbol_native, name, raw_rounding) VALUES 
      ('eur', '€', '€', 'Euro', '{}'),
      ('usd', '$', '$', 'US Dollar', '{}')
      ON CONFLICT DO NOTHING
    `)

    const currencies = ['mad', 'eur', 'usd']
    
    for (const code of currencies) {
      // Vérif si déjà lié
      const check = await client.query(`SELECT id FROM store_currency WHERE store_id = $1 AND currency_code = $2`, [storeId, code])
      
      if (check.rowCount === 0) {
        const newId = "stcurr_" + Math.random().toString(36).substring(2, 15)
        // is_default est true pour MAD, false pour les autres
        const isDefault = code === 'mad'
        
        // Tentative d'insertion (avec colonne is_default si elle existe)
        try {
            await client.query(`
                INSERT INTO store_currency (id, store_id, currency_code, is_default)
                VALUES ($1, $2, $3, $4)
            `, [newId, storeId, code, isDefault])
        } catch (e) {
            // Fallback sans is_default
            await client.query(`
                INSERT INTO store_currency (id, store_id, currency_code)
                VALUES ($1, $2, $3)
            `, [newId, storeId, code])
        }
        console.log(`✅ Devise ajoutée au Store : ${code}`)
      }
    }

    console.log("🎉 TERMINÉ : L'Admin devrait être stable.")
    console.log("👉 Arrête le serveur, relance (yarn dev) et vide le cache (Ctrl+F5) !")

  } catch (error) {
    console.error("❌ Erreur :", error)
  } finally {
    await client.end()
  }
}