import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function fixAdminPricing() {
  console.log("🚀 Réparation finale de l'Admin Pricing (Mode Vérification)...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // Liste des devises à vérifier/réparer
    // On force aussi EUR et USD au cas où l'interface les chercherait
    const currenciesToCheck = ['mad', 'eur', 'usd']

    console.log(`ℹ️  Vérification pour : ${currenciesToCheck.join(', ')}`)

    let count = 0

    // 1. Boucle sur les devises
    for (const code of currenciesToCheck) {
      // ÉTAPE A : Vérifier si la préférence existe déjà
      const existing = await client.query(`
        SELECT id FROM price_preference 
        WHERE attribute = 'currency_code' AND value = $1
      `, [code])

      if (existing.rowCount > 0) {
        console.log(`✅ Préférence pour '${code}' existe déjà.`)
      } else {
        // ÉTAPE B : Insérer si elle n'existe pas
        const ppId = "pp_" + Math.random().toString(36).substring(2, 15)
        await client.query(`
          INSERT INTO price_preference (id, attribute, value, is_tax_inclusive)
          VALUES ($1, 'currency_code', $2, false)
        `, [ppId, code])
        console.log(`➕ Préférence créée pour '${code}'.`)
        count++
      }
    }

    // 2. Boucle sur les Régions (Sécurité)
    const regionRes = await client.query("SELECT id FROM region")
    for (const row of regionRes.rows) {
      const existingReg = await client.query(`
        SELECT id FROM price_preference 
        WHERE attribute = 'region_id' AND value = $1
      `, [row.id])

      if (existingReg.rowCount === 0) {
        const ppIdReg = "pp_" + Math.random().toString(36).substring(2, 15)
        await client.query(`
            INSERT INTO price_preference (id, attribute, value, is_tax_inclusive)
            VALUES ($1, 'region_id', $2, false)
        `, [ppIdReg, row.id])
        console.log(`➕ Préférence créée pour la région ${row.id}.`)
      }
    }

    console.log("🎉 RÉPARATION TERMINÉE.")
    console.log("👉 Retourne sur l'Admin, fais F5 (ou Ctrl+F5) et teste !")

  } catch (error) {
    console.error("❌ Erreur :", error)
  } finally {
    await client.end()
  }
}