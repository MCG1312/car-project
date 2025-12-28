import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, IRegionModuleService, ISalesChannelModuleService } from "@medusajs/framework/types"

export default async function seedCarParts({ container }: ExecArgs) {
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)
  const regionService: IRegionModuleService = container.resolve(Modules.REGION)
  const salesChannelService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  console.log("🚀 Démarrage du seed CarPartsPro (Maroc)...")

  // 1. Récupération du Canal de Vente
  const salesChannels = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel"
  })
  
  let defaultSalesChannel = salesChannels[0]
  if (!defaultSalesChannel) {
    defaultSalesChannel = await salesChannelService.createSalesChannels({
      name: "Default Sales Channel",
      description: "Canal par défaut"
    })
  }

  // 2. Région Maroc
  let region = (await regionService.listRegions({ currency_code: "mad" }))[0]
  if (!region) {
    region = await regionService.createRegions({
      name: "Maroc",
      currency_code: "mad",
      countries: ["ma"],
      payment_providers: ["pp_system_default"]
    })
  }

  // 3. Création du Produit
  console.log("Creating products...")
  
  const productData = [
    {
      title: "Plaquettes de Frein Avant",
      description: "Plaquettes haute performance céramique",
      status: "published",
      metadata: {
        reference_oem: "BRAKE-REN-2015", 
        compatibility: {
          vehicles: [
            { brand: "Renault", model: "Clio IV", year: 2015, engine: "1.5 dCi" }
          ]
        }
      },
      // Définition de l'option possible
      options: [
        { title: "Type", values: ["Standard"] }
      ],
      // Définition de la variante concrète
      variants: [
        {
          title: "Standard",
          sku: "BRAKE-REN-2015",
          // --- LE FIX EST ICI ---
          // Il faut dire explicitement que cette variante correspond à Type=Standard
          options: {
            "Type": "Standard"
          },
          // ----------------------
          prices: [
            { amount: 45000, currency_code: "mad" }
          ]
        }
      ],
      sales_channels: [
        { id: defaultSalesChannel.id }
      ]
    }
  ]

  const products = await productService.createProducts(productData)

  console.log(`✅ Produit créé : ${products[0].title}`)
  console.log("🎉 Seed terminé ! Vos produits sont maintenant visibles.")
}