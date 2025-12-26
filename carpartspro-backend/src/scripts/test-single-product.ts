import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function testSingleProduct({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT) as any
  const regionModuleService = container.resolve(Modules.REGION) as any
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL) as any

  console.log("🧪 TEST: Création d'un produit simple\n")

  try {
    // 1. Récupérer la région MAD
    const regions = await regionModuleService.listRegions()
    const madRegion = regions.find((r: any) => r.currency_code.toLowerCase() === 'mad')
    
    if (!madRegion) throw new Error("❌ Région MAD introuvable")
    console.log(`✅ Région MAD: ${madRegion.id}`)

    // 2. Sales channel
    const salesChannel = (await salesChannelService.listSalesChannels({ name: "Default Sales Channel" }))[0]
    console.log(`✅ Sales Channel: ${salesChannel.id}\n`)

    // TEST 1: Sans options du tout
    console.log("🧪 TEST 1: Produit SANS options")
    try {
      const test1 = await productModuleService.createProducts({
        title: "Test Sans Options",
        handle: "test-sans-options",
        status: "published",
        variants: [{
          title: "Test Sans Options",
          sku: "TEST-001",
          prices: [{ 
            amount: 10000, 
            currency_code: "mad",
            region_id: madRegion.id
          }]
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
      console.log("✅ TEST 1 RÉUSSI - Pas besoin d'options !\n")
    } catch (e: any) {
      console.log(`❌ TEST 1 ÉCHOUÉ: ${e.message}\n`)
    }

    // TEST 2: Avec option "Type" / "Standard"
    console.log("🧪 TEST 2: Option Type / Standard")
    try {
      const test2 = await productModuleService.createProducts({
        title: "Test Avec Type",
        handle: "test-avec-type",
        status: "published",
        options: [{ title: "Type", values: ["Standard"] }],
        variants: [{
          title: "Test Avec Type",
          sku: "TEST-002",
          options: { Type: "Standard" },
          prices: [{ 
            amount: 10000, 
            currency_code: "mad",
            region_id: madRegion.id
          }]
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
      console.log("✅ TEST 2 RÉUSSI\n")
    } catch (e: any) {
      console.log(`❌ TEST 2 ÉCHOUÉ: ${e.message}\n`)
    }

    // TEST 3: Avec option = titre du produit
    console.log("🧪 TEST 3: Option avec titre du produit")
    try {
      const productTitle = "Rotule de direction"
      const test3 = await productModuleService.createProducts({
        title: productTitle,
        handle: "test-rotule",
        status: "published",
        options: [{ title: productTitle, values: [productTitle] }],
        variants: [{
          title: productTitle,
          sku: "TEST-003",
          options: { [productTitle]: productTitle },
          prices: [{ 
            amount: 10000, 
            currency_code: "mad",
            region_id: madRegion.id
          }]
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
      console.log("✅ TEST 3 RÉUSSI\n")
    } catch (e: any) {
      console.log(`❌ TEST 3 ÉCHOUÉ: ${e.message}\n`)
    }

    // Vérifier les produits créés
    console.log("\n📦 Vérification des produits créés:")
    const allProducts = await productModuleService.listProducts({}, { 
      take: 10,
      relations: ["variants", "variants.prices"] // ← AJOUT
    })
    
    for (const product of allProducts) {
      console.log(`\n   ${product.title} (${product.handle})`)
      if (product.variants && product.variants.length > 0) {
        console.log(`   ✅ ${product.variants.length} variant(s)`)
        if (product.variants[0].prices) {
          console.log(`   💰 ${product.variants[0].prices.length} prix`)
        }
      } else {
        console.log(`   ❌ Aucun variant`)
      }
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
  }
}