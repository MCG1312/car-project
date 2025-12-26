import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function forceMad({ container }: ExecArgs) {
  console.log("🚀 Force-activation du MAD via SQL (Mode Manager)...")

  try {
    // 1. On récupère le Manager (l'outil qui parle à la base de données)
    const manager = container.resolve(ContainerRegistrationKeys.MANAGER)

    // 2. On s'assure que le MAD existe dans la table des devises
    await manager.execute(`
      INSERT INTO currency (code, symbol, symbol_native, name)
      VALUES ('mad', 'MAD', 'DH', 'Moroccan Dirham')
      ON CONFLICT (code) DO NOTHING;
    `)
    console.log("✅ Devise MAD vérifiée.")

    // 3. On récupère l'ID du Store
    const stores = await manager.execute(`SELECT id FROM store LIMIT 1`)
    const storeId = stores[0]?.id

    if (!storeId) throw new Error("Aucun magasin trouvé dans la base !")
    console.log(`ℹ️  ID du Store trouvé : ${storeId}`)

    // 4. On force le MAD comme devise par défaut
    await manager.execute(`
      UPDATE store 
      SET default_currency_code = 'mad' 
      WHERE id = '${storeId}'
    `)
    console.log("✅ Store mis à jour avec default_currency_code = 'mad'")

    // 5. On force la liaison (Table de liaison)
    // On essaie d'insérer dans la table de liaison des devises
    try {
      await manager.execute(`
        INSERT INTO store_supported_currencies (store_id, currency_code, is_default)
        VALUES ('${storeId}', 'mad', true)
        ON CONFLICT (store_id, currency_code) DO UPDATE SET is_default = true
      `)
      console.log("✅ Liaison ajoutée dans 'store_supported_currencies'.")
    } catch (e) {
      // Si la table s'appelle différemment (v2 beta vs stable), on essaie l'autre nom
      try {
        await manager.execute(`
          INSERT INTO store_currencies (store_id, currency_code)
          VALUES ('${storeId}', 'mad')
          ON CONFLICT DO NOTHING
        `)
        console.log("✅ Liaison ajoutée dans 'store_currencies'.")
      } catch (e2) {
        console.log("⚠️ Avertissement : Impossible d'insérer dans la table de liaison, mais le défaut est mis.")
      }
    }

    console.log("🎉 SUCCÈS TOTAL : Le Store est forcé en MAD.")
    console.log("👉 Retourne sur l'admin, rafraîchis (F5), et ajoute ton prix !")

  } catch (error) {
    console.error("❌ Erreur SQL :", error)
  }
}