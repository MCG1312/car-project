import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function fixUiCrash() {
  console.log("🚀 Réparation du crash UI (Price Preference)...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // 1. On vérifie si la table price_preference existe
    // (Medusa v2 l'utilise pour savoir comment afficher les inputs de prix)
    
    // Génération d'un ID
    const ppId = "pp_" + Math.random().toString(36).substring(2, 15)

    // Insertion de la préférence pour le MAD
    // attribute: 'currency_code', value: 'mad', is_tax_inclusive: false
    await client.query(`
      INSERT INTO price_preference (id, attribute, value, is_tax_inclusive)
      VALUES ($1, 'currency_code', 'mad', false)
      ON CONFLICT DO NOTHING
    `, [ppId])

    console.log("✅ Préférence de prix ajoutée pour le MAD.")
    
    // 2. Sécurité : On s'assure aussi que la Région Maroc a bien cette info
    // On récupère l'ID de la région Maroc
    const regionRes = await client.query("SELECT id FROM region WHERE name = 'Maroc' OR currency_code = 'mad' LIMIT 1")
    
    if (regionRes.rows.length > 0) {
      const regionId = regionRes.rows[0].id
      const regionPpId = "pp_" + Math.random().toString(36).substring(2, 15)
      
      await client.query(`
        INSERT INTO price_preference (id, attribute, value, is_tax_inclusive)
        VALUES ($1, 'region_id', $2, false)
        ON CONFLICT DO NOTHING
      `, [regionPpId, regionId])
      console.log("✅ Préférence de prix ajoutée pour la Région Maroc.")
    }

    console.log("🎉 RÉPARATION TERMINÉE.")
    console.log("👉 Redémarre le serveur (yarn dev) et rafraîchis l'admin.")

  } catch (error) {
    // Si la table n'existe pas, c'est peut-être une version très récente de v2
    console.error("❌ Erreur :", error.message)
  } finally {
    await client.end()
  }
}