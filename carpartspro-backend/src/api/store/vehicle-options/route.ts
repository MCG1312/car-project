import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // On récupère le service en forçant le type `any` pour être sûr
  const productService = req.scope.resolve(Modules.PRODUCT) as any
  const { type, brand, model } = req.query

  // --- Validation ---
  if (!type || !['brand', 'model', 'year'].includes(type as string)) {
    return res.status(400).json({ message: "Paramètre 'type' invalide." })
  }
  if (type === 'model' && !brand) {
    return res.status(400).json({ message: "Le paramètre 'brand' est requis." })
  }
  if (type === 'year' && (!brand || !model)) {
    return res.status(400).json({ message: "Les paramètres 'brand' et 'model' sont requis." })
  }

  try {
    // --- Récupération des données ---
    // On ne récupère QUE les métadonnées pour que ce soit ultra-rapide
    const [products] = await productService.listAndCountProducts(
      { status: 'published' },
      { take: 2000, select: ["metadata"] }
    )

    // --- Traitement ---
    const options = new Set<string>()

    for (const product of products) {
      const vehicles = product.metadata?.compatibility?.vehicles as any[]
      if (!vehicles || !Array.isArray(vehicles)) continue

      for (const vehicle of vehicles) {
        if (!vehicle) continue // Sécurité

        if (type === "brand" && vehicle.brand) {
          options.add(vehicle.brand)
        } 
        else if (type === "model" && vehicle.brand?.toLowerCase() === (brand as string)?.toLowerCase()) {
          if (vehicle.model) options.add(vehicle.model)
        }
        else if (type === "year" && vehicle.brand?.toLowerCase() === (brand as string)?.toLowerCase() && vehicle.model?.toLowerCase() === (model as string)?.toLowerCase()) {
          if (vehicle.year) options.add(vehicle.year.toString())
        }
      }
    }

    // On convertit le Set en tableau trié
    const sortedOptions = Array.from(options).sort((a, b) => {
      // Tri numérique pour les années, alphabétique pour le reste
      return type === 'year' ? parseInt(b) - parseInt(a) : a.localeCompare(b)
    })

    // --- Réponse ---
    res.json({
      options: sortedOptions,
    })
    
  } catch (error) {
    console.error("Erreur API /vehicle-options:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}