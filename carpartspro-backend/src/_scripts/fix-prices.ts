import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService, IRegionModuleService } from "@medusajs/framework/types"
import fs from "fs"
import csv from "csv-parser"
import { Client } from "pg"

// Fonctions utilitaires
const toHandle = (str: string) => {
  if (!str) return ""
  const handle = str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return handle || "product"
}

function parseCarType(typeVoiture: string) {
  const vehicles: any[] = []
  if (!typeVoiture) return []
  
  const parts = typeVoiture.split(/[\/\+]/)
  for (const part of parts) {
    let cleanPart = part.trim().toUpperCase()
    let brand = "Autre"
    let model = cleanPart
    
    if (cleanPart.startsWith("PGT") || cleanPart.startsWith("P.") || cleanPart.startsWith("P ")) {
      brand = "Peugeot"
      model = cleanPart.replace(/PGT|P\.|P /g, "").trim()
    } else if (cleanPart.startsWith("CIT") || cleanPart.startsWith("C.") || cleanPart.startsWith("C ")) {
      brand = "Citroën"
      model = cleanPart.replace(/CIT|C\.|C /g, "").trim()
    } else if (cleanPart.startsWith("REN") || cleanPart.startsWith("R.")) {
      brand = "Renault"
      model = cleanPart.replace(/REN|R\./g, "").trim()
    }
    
    if (model === "") model = "Tous modèles"
    vehicles.push({ brand, model, year: null })
  }
  return vehicles
}

export default async function importFinal({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT) as IProductModuleService
  const salesChannelService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const regionService: IRegionModuleService = container.resolve(Modules.REGION)
  
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  console.log("🚀 Démarrage de l'import FINAL (avec IMAGES et PRIX CORRIGÉS)...")

  try {
    await client.connect()

    // 1. Récupérer la région MAD existante
    console.log("🌍 Récupération de la région MAD...")
    let madRegion
    try {
      const regions = await regionService.listRegions({ 
        currency_code: "mad" 
      })
      
      if (!regions || regions.length === 0) {
        console.log("❌ Aucune région MAD trouvée. Créez d'abord une région Maroc avec la devise MAD.")
        throw new Error("Région MAD manquante")
      }
      
      madRegion = regions[0]
      console.log(`✅ Région MAD trouvée: ${madRegion.id} (${madRegion.name})`)
    } catch (error) {
      console.error("❌ Erreur lors de la récupération de la région:", error)
      throw error
    }

    // 2. Lire le CSV
    const csvData: any[] = []
    const filePath = "products_with_images.csv"
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ Fichier ${filePath} introuvable !`)
    }
    
    await new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (d) => csvData.push(d))
        .on('end', resolve)
    })
    console.log(`📂 ${csvData.length} lignes lues depuis ${filePath}.`)

    // 3. NETTOYAGE COMPLET DE LA BASE (SAUF region et autres tables système)
    console.log("🗑️ Nettoyage des produits existants...")
    
    await client.query(`SET session_replication_role = 'replica';`)
    
    const tablesToTruncate = [
      'product_variant_inventory_item',
      'product_sales_channel',
      'product_category_product',
      'product_variant',
      'product_option_value',
      'product_option',
      'product_image',
      'product_tag',
      'product_type',
      'product_collection',
      'product',
      'product_category'
    ]
    
    for (const table of tablesToTruncate) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`)
        console.log(`  ✓ ${table} nettoyée`)
      } catch (err: any) {
        if (!err.message.includes('does not exist')) {
          console.log(`  ⚠ ${table}: ${err.message}`)
        }
      }
    }
    
    await client.query(`SET session_replication_role = 'origin';`)
    console.log("✅ Produits nettoyés.")
    
    // 4. Créer les catégories
    console.log("🛠️  Création des catégories...")
    const categoryMap = new Map<string, any>()
    
    const mainCategories = new Set<string>()
    const subCategoriesMap = new Map<string, Set<string>>()
    
    for (const row of csvData) {
      const mainCatName = row['Catégorie Principale']?.trim()
      if (!mainCatName) continue
      
      mainCategories.add(mainCatName)
      
      const subCatName = row['Sous-Catégorie']?.trim()
      if (subCatName) {
        if (!subCategoriesMap.has(mainCatName)) {
          subCategoriesMap.set(mainCatName, new Set())
        }
        subCategoriesMap.get(mainCatName)!.add(subCatName)
      }
    }
    
    console.log(`  📦 Création de ${mainCategories.size} catégories principales...`)
    const mainCatsArray = Array.from(mainCategories).map(name => ({
      name,
      is_active: true,
      handle: toHandle(name)
    }))
    
    const createdMainCategories = await productService.createProductCategories(mainCatsArray)
    
    createdMainCategories.forEach(cat => {
      categoryMap.set(cat.name, cat)
    })
    
    console.log(`  📦 Création des sous-catégories...`)
    const subCatsToCreate: any[] = []
    
    for (const [mainCatName, subCatNames] of subCategoriesMap.entries()) {
      const parentCategory = categoryMap.get(mainCatName)
      if (!parentCategory) continue
      
      for (const subCatName of subCatNames) {
        subCatsToCreate.push({
          name: subCatName,
          parent_category_id: parentCategory.id,
          is_active: true,
          handle: `${toHandle(mainCatName)}-${toHandle(subCatName)}`
        })
      }
    }
    
    if (subCatsToCreate.length > 0) {
      const createdSubCategories = await productService.createProductCategories(subCatsToCreate)
      
      createdSubCategories.forEach(cat => {
        const parent = createdMainCategories.find(p => p.id === cat.parent_category_id)
        if (parent) {
          categoryMap.set(`${parent.name} > ${cat.name}`, cat)
        }
      })
    }
    
    console.log(`✅ ${categoryMap.size} catégories créées.`)

    // 5. Récupérer le Sales Channel
    const salesChannels = await salesChannelService.listSalesChannels({ 
      name: "Default Sales Channel" 
    })
    
    if (!salesChannels || salesChannels.length === 0) {
      throw new Error("❌ Sales Channel par défaut introuvable")
    }
    
    const salesChannel = salesChannels[0]
    console.log(`✅ Sales Channel: ${salesChannel.id}`)

    // 6. Préparer et Importer les produits AVEC IMAGES et PRIX CORRECTS
    const productsToCreate: any[] = []
    
    for (const row of csvData) {
      const ref = row['Référence']?.trim() || ""
      const title = row['Produit']?.trim() || "Produit sans nom"
      const mainCatName = row['Catégorie Principale']?.trim()
      const subCatName = row['Sous-Catégorie']?.trim()
      const imageUrl = row['Image URL']?.trim()
      
      let categoryToAssign = null
      if (subCatName && mainCatName) {
        categoryToAssign = categoryMap.get(`${mainCatName} > ${subCatName}`)
      } else if (mainCatName) {
        categoryToAssign = categoryMap.get(mainCatName)
      }
      
      const priceAmount = Math.round(parseFloat(row['prix']?.replace(',', '.') || '0') * 100)
      
      const titleHandle = toHandle(title)
      const refHandle = toHandle(ref)
      let uniqueHandle = ""
      
      if (titleHandle && refHandle) {
        uniqueHandle = `${titleHandle}-${refHandle}`
      } else if (titleHandle) {
        uniqueHandle = `${titleHandle}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } else if (refHandle) {
        uniqueHandle = `product-${refHandle}`
      } else {
        uniqueHandle = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      uniqueHandle = uniqueHandle.replace(/-+$/g, '') || `product-${Date.now()}`
      
      const sku = ref && ref.trim() !== "" 
        ? ref.trim() 
        : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const images = (imageUrl && imageUrl !== 'NOT_FOUND' && imageUrl !== '') 
        ? [{ url: imageUrl }] 
        : []
      
      productsToCreate.push({
        title,
        handle: uniqueHandle,
        status: "published",
        categories: categoryToAssign ? [{ id: categoryToAssign.id }] : [],
        metadata: {
          reference_oem: ref,
          compatibility: {
            vehicles: parseCarType(row['Type Voiture'])
          }
        },
        images: images,
        thumbnail: imageUrl && imageUrl !== 'NOT_FOUND' && imageUrl !== '' ? imageUrl : null,
        options: [{ title: "Type", values: ["Standard"] }],
        variants: [{
          title: "Standard",
          sku: sku,
          manage_inventory: false,
          options: { "Type": "Standard" },
          prices: [{
            amount: priceAmount,
            currency_code: "mad"
          }]
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
    }

    console.log(`⚡ Importation de ${productsToCreate.length} produits...`)
    const batchSize = 25
    let imported = 0
    
    for (let i = 0; i < productsToCreate.length; i += batchSize) {
      const batch = productsToCreate.slice(i, i + batchSize)
      await productService.createProducts(batch)
      imported += batch.length
      process.stdout.write(`\r  Importés: ${imported}/${productsToCreate.length}`)
    }

    console.log("\n\n🎉 TERMINÉ !")
    console.log(`✅ ${productsToCreate.length} produits importés avec succès`)
    console.log(`✅ Images intégrées`)
    console.log(`✅ Prix associés à la région ${madRegion.name} (${madRegion.currency_code})`)

  } catch (error) {
    console.error("\n❌ Erreur critique:", error)
    throw error
  } finally {
    await client.end()
  }
}