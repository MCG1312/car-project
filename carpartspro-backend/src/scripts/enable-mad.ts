import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IStoreModuleService } from "@medusajs/framework/types"

export default async function enableMad({ container }: ExecArgs) {
  const storeService: IStoreModuleService = container.resolve(Modules.STORE)

  console.log("🚀 Correction de la configuration du Store (Méthode Upsert)...")

  // 1. On récupère le magasin existant
  const stores = await storeService.listStores()
  const store = stores[0]

  if (!store) {
    console.log("❌ Aucun store trouvé.")
    return
  }

  // 2. Utilisation de upsertStores au lieu de updateStores
  // Cela force la réécriture de la configuration
  try {
    await storeService.upsertStores([
      {
        id: store.id,
        name: store.name, // On garde le nom
        // On définit les devises supportées
        supported_currencies: [ 
          { currency_code: "mad", is_default: true },
          { currency_code: "eur", is_default: false },
          { currency_code: "usd", is_default: false }
        ],
        // On définit la devise par défaut globale
        default_currency_code: "mad"
      }
    ])
    console.log("✅ SUCCÈS : Le MAD est activé via Upsert.")
  } catch (error) {
    console.error("❌ Erreur persistante :", error)
  }
}