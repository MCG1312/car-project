import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugPrices({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT) as any
  const regionModuleService = container.resolve(Modules.REGION) as any

  console.log("\n🔍 DIAGNOSTIC DES PRIX\n")

  try {
    // 1. Vérifier les régions
    console.log("📍 RÉGIONS DISPONIBLES:")
    const regions = await regionModuleService.listRegions()
    regions.forEach((region: any) => {
      console.log(`   - ${region.name} (${region.id}): ${region.currency_code}`)
    })

    // 2. Récupérer quelques produits
    console.log("\n📦 VÉRIFICATION DES PRODUITS:")
    const products = await productModuleService.listProducts({}, { 
      take: 5,
      relations: ["variants", "variants.prices"] // ← IMPORTANT
    })

    for (const product of products) {
      console.log(`\n   Produit: ${product.title}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Handle: ${product.handle}`)
      
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants[0]
        console.log(`   Variant ID: ${variant.id}`)
        
        // Récupérer les prix du variant
        if (variant.prices && variant.prices.length > 0) {
          console.log(`   ✅ Prices trouvés: ${variant.prices.length}`)
          variant.prices.forEach((price: any) => {
            console.log(`      - ${price.amount} ${price.currency_code} (Region: ${price.region_id || 'N/A'})`)
          })
        } else {
          console.log(`   ❌ AUCUN PRIX sur ce variant !`)
        }
      } else {
        console.log(`   ❌ AUCUN VARIANT !`)
      }
    }

    // 3. Vérifier la structure complète d'un produit
    console.log("\n🔎 STRUCTURE DÉTAILLÉE D'UN PRODUIT:")
    if (products.length > 0) {
      const sampleProduct = products[0]
      console.log(JSON.stringify({
        id: sampleProduct.id,
        title: sampleProduct.title,
        handle: sampleProduct.handle,
        variants: sampleProduct.variants?.map((v: any) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          prices: v.prices
        }))
      }, null, 2))
    }

    console.log("\n✅ Diagnostic terminé")

  } catch (error) {
    console.error("❌ Erreur:", error)
  }
}