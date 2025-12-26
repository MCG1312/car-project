import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function correctPrices() {
  console.log("🚀 Correction des prix (x100) pour le MAD...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // 1. Vérification avant modification
    // On regarde combien de prix semblent "trop petits" (inférieurs à 100 MAD, soit 10000 centimes)
    // C'est une sécurité pour ne pas multiplier des prix qui seraient déjà bons.
    const check = await client.query(`
      SELECT count(*) as count 
      FROM price 
      WHERE currency_code = 'mad' 
      AND amount < 10000 
      AND amount > 0
    `)
    
    const count = parseInt(check.rows[0].count)
    console.log(`🔍 Analyse : ${count} prix suspects trouvés (inférieurs à 100.00 MAD en valeur brute).`)

    if (count === 0) {
      console.log("✅ Aucun prix à corriger (ou ils sont tous > 100 MAD).")
      return
    }

    // 2. Application de la correction (x100)
    // On met à jour la table 'price' qui contient les montants
    const res = await client.query(`
      UPDATE price
      SET amount = amount * 100
      WHERE currency_code = 'mad'
      AND amount < 10000 -- Sécurité : on ne touche pas aux gros montants
      AND amount > 0
    `)

    console.log(`✅ CORRECTION APPLIQUÉE : ${res.rowCount} prix ont été multipliés par 100.`)
    console.log("👉 Exemple : 57 (0.57 MAD) est devenu 5700 (57.00 MAD).")

  } catch (error) {
    console.error("❌ Erreur SQL :", error)
  } finally {
    await client.end()
  }
}