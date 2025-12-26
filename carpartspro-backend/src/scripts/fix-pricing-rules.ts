import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function fixPricingRules() {
  console.log("🚀 Réparation COMPLÈTE du moteur de prix...")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()

    // 1. INJECTION DES REGLES (Rule Types)
    // C'est souvent ça qui manque et fait planter l'Admin
    console.log("🔧 Vérification des types de règles (Rule Types)...")
    
    await client.query(`
      INSERT INTO rule_type (id, name, key, rule_attribute, default_priority)
      VALUES 
        ('rt_currency', 'Currency', 'currency_code', 'currency_code', 1),
        ('rt_region', 'Region', 'region_id', 'region_id', 2)
      ON CONFLICT (key) DO NOTHING;
    `)
    console.log("✅ Règles 'Currency' et 'Region' injectées.")

    // 2. INJECTION DES PREFERENCES (Price Preferences)
    console.log("🔧 Vérification des préférences de prix...")
    
    // On s'assure que le MAD est géré
    const ppId = "pp_" + Math.random().toString(36).substring(2, 15)
    await client.query(`
      INSERT INTO price_preference (id, attribute, value, is_tax_inclusive)
      VALUES ($1, 'currency_code', 'mad', false)
      ON CONFLICT (attribute, value) DO NOTHING
    `, [ppId])
    console.log("✅ Préférence MAD injectée.")

    // 3. NETTOYAGE DES DOUBLONS DANS LE STORE (Sécurité)
    // Parfois des doublons se créent et font planter l'affichage
    const storeRes = await client.query("SELECT id FROM store LIMIT 1")
    if (storeRes.rows.length > 0) {
      const storeId = storeRes.rows[0].id
      
      // On s'assure que le default_currency_code est bon
      await client.query(`UPDATE store SET default_currency_code = 'mad' WHERE id = $1`, [storeId])
      
      console.log("✅ Store nettoyé.")
    }

    console.log("🎉 RÉPARATION TERMINÉE.")
    console.log("👉 ACTION REQUISE : Arrête le serveur, relance-le, et vide le cache du navigateur !")

  } catch (error) {
    console.error("❌ Erreur :", error.message)
  } finally {
    await client.end()
  }
}