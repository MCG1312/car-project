import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/framework/types"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // 1. Récupérer le service produit
  const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)

  // 2. Récupérer les paramètres d'URL
  const { brand, model, year } = req.query

  // 3. Validation simple
  if (!brand || !model) {
    return res.status(400).json({
      message: "Paramètres manquants : brand et model sont requis."
    })
  }

  try {
    // 4. Récupérer les produits
    // CORRECTION APPLIQUÉE : On sépare bien les filtres (arg 1) de la config (arg 2)
    const [products, count] = await productService.listAndCountProducts(
      { 
        status: "published" 
      },
      { 
        take: 100,
        relations: ["variants", "options"]
      }
    )

    // 5. Filtrage intelligent dans les métadonnées
    const compatibleProducts = products.filter(product => {
      const metadata = product.metadata || {}
      
      // On vérifie si la structure existe
      if (!metadata.compatibility || !(metadata.compatibility as any).vehicles) {
        return false
      }

      const vehicles = (metadata.compatibility as any).vehicles

      // On cherche si un véhicule correspond
      return vehicles.some((v: any) => {
        const brandMatch = v.brand?.toLowerCase() === (brand as string).toLowerCase()
        const modelMatch = v.model?.toLowerCase() === (model as string).toLowerCase()
        const yearMatch = year ? v.year?.toString() === year.toString() : true

        return brandMatch && modelMatch && yearMatch
      })
    })

    // 6. Réponse JSON
    res.json({
      products: compatibleProducts,
      count: compatibleProducts.length
    })

  } catch (error) {
    console.error("ERREUR API RECHERCHE :", error)
    res.status(500).json({ message: "Erreur interne serveur" })
  }
}