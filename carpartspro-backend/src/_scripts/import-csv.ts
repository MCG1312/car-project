import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService } from "@medusajs/framework/types"
import fs from "fs"
import csv from "csv-parser"

// Fonctions utilitaires
const toHandle = (str: string) => str ? str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : ""

function parseCarType(typeVoiture: string) {
  const vehicles: any[] = [];
  if (!typeVoiture) return [];
  const parts = typeVoiture.split(/[\/\+]/);
  for (const part of parts) { let cleanPart = part.trim().toUpperCase(); let brand = "Autre"; let model = cleanPart; if (cleanPart.startsWith("PGT") || cleanPart.startsWith("P.") || cleanPart.startsWith("P ")) { brand = "Peugeot"; model = cleanPart.replace(/PGT|P\.|P /g, "").trim(); } else if (cleanPart.startsWith("CIT") || cleanPart.startsWith("C.") || cleanPart.startsWith("C ")) { brand = "Citroën"; model = cleanPart.replace(/CIT|C\.|C /g, "").trim(); } else if (cleanPart.startsWith("REN") || cleanPart.startsWith("R.")) { brand = "Renault"; model = cleanPart.replace(/REN|R\./g, "").trim(); } if (model === "") model = "Tous modèles"; vehicles.push({ brand, model, year: null }); }
  return vehicles
}

export default async function importCsvWithCategories({ container }: ExecArgs) {
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)
  const salesChannelService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  console.log("🚀 Démarrage de l'import CSV final (avec Catégories)...")

  // 1. Config
  const salesChannel = (await salesChannelService.listSalesChannels({ name: "Default Sales Channel" }))[0]
  if (!salesChannel) throw new Error("Sales Channel introuvable.")
  
  // 2. Lire le CSV
  const csvData: any[] = []
  const filePath = "products.csv"
  if (!fs.existsSync(filePath)) throw new Error("❌ Fichier products.csv introuvable !")
  
  await new Promise((resolve) => {
    fs.createReadStream(filePath).pipe(csv({ separator: ';' })).on('data', (d) => csvData.push(d)).on('end', resolve)
  })

  // 3. Nettoyer la base
  console.log("🗑️ Suppression des anciens produits et catégories...")
  const existingProducts = await productService.listProducts({}, { take: 10000, select: ["id"] })
  if (existingProducts.length > 0) await productService.deleteProducts(existingProducts.map(p => p.id))
  
  // --- CORRECTION ICI ---
  // On appelle bien listCategories sur le productService
  const existingCategories = await productService.listCategories({}, { take: 1000, select: ["id"] })
  if (existingCategories.length > 0) await productService.deleteCategories(existingCategories.map(c => c.id))
  console.log("✅ Base nettoyée.")

  // 4. Créer les catégories
  console.log("🛠️  Création de la structure des catégories...")
  const categoryMap = new Map<string, any>()

  for (const row of csvData) {
    const mainCatName = row['Catégorie Principale']?.trim()
    const subCatName = row['Sous-Catégorie']?.trim()

    if (!mainCatName) continue

    if (!categoryMap.has(mainCatName)) {
      const category = await productService.createCategories({ name: mainCatName, is_active: true })
      categoryMap.set(mainCatName, category)
      process.stdout.write(`C`)
    }

    if (subCatName && !categoryMap.has(`${mainCatName} > ${subCatName}`)) {
      const parentCategory = categoryMap.get(mainCatName)
      const subCategory = await productService.createCategories({
        name: subCatName,
        parent_category_id: parentCategory.id,
        is_active: true
      })
      categoryMap.set(`${mainCatName} > ${subCatName}`, subCategory)
      process.stdout.write(`S`)
    }
  }
  console.log("\n✅ Structure des catégories créée.")
  
  // 5. Préparation des produits
  console.log("📦 Préparation des produits pour l'import...")
  const productsToCreate: any[] = []

  for (const row of csvData) {
    const ref = row['Référence']
    const title = row['Produit']
    const mainCatName = row['Catégorie Principale']?.trim()
    const subCatName = row['Sous-Catégorie']?.trim()
    
    let categoryToAssign = null
    if (subCatName) {
      categoryToAssign = categoryMap.get(`${mainCatName} > ${subCatName}`)
    } else if (mainCatName) {
      categoryToAssign = categoryMap.get(mainCatName)
    }

    const priceAmount = Math.round(parseFloat(row['prix']?.replace(',', '.') || '0') * 100)
    const uniqueHandle = `${toHandle(title)}-${toHandle(ref)}`

    productsToCreate.push({
      title, handle: uniqueHandle, status: "published",
      categories: categoryToAssign ? [{ id: categoryToAssign.id }] : [],
      metadata: { reference_oem: ref, compatibility: { vehicles: parseCarType(row['Type Voiture']) }},
      options: [{ title: "Type", values: ["Standard"] }],
      variants: [{ title: "Standard", sku: ref, options: { "Type": "Standard" }, prices: [{ amount: priceAmount, currency_code: "mad" }] }],
      sales_channels: [{ id: salesChannel.id }]
    })
  }

  // 6. Import final
  console.log(`⚡ Importation de ${productsToCreate.length} produits...`)
  const batchSize = 50
  for (let i = 0; i < productsToCreate.length; i += batchSize) {
    await productService.createProducts(productsToCreate.slice(i, i + batchSize))
    process.stdout.write(".")
  }

  console.log("\n🎉 TERMINÉ ! Produits et catégories importés.")
}