import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService } from "@medusajs/framework/types"
import fs from "fs"
import csv from "csv-parser"
import { Client } from "pg"

// Fonctions utilitaires
const toHandle = (str: string) => {
  if (!str) return ""
  const handle = str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer caractères spéciaux par -
    .replace(/^-+|-+$/g, "") // Enlever - au début/fin
  return handle || "product" // Fallback si vide
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
  
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  console.log("🚀 Démarrage de l'import FINAL (avec IMAGES)...")

  try {
    await client.connect()

    // 1. Lire le CSV
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

    // 2. NETTOYAGE COMPLET DE LA BASE
    console.log("🗑️ Nettoyage COMPLET de la base de données...")
    
    // Désactiver temporairement les contraintes de clés étrangères
    await client.query(`SET session_replication_role = 'replica';`)
    
    // Supprimer TOUTES les tables liées aux produits et catégories
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
        // Ignorer si la table n'existe pas
        if (!err.message.includes('does not exist')) {
          console.log(`  ⚠ Erreur sur ${table}: ${err.message}`)
        }
      }
    }
    
    // Réactiver les contraintes
    await client.query(`SET session_replication_role = 'origin';`)
    
    console.log("✅ Base nettoyée complètement.")
    
    // 3. Créer les catégories
    console.log("🛠️  Création des catégories...")
    const categoryMap = new Map<string, any>()
    
    // Collecter toutes les catégories uniques d'abord
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
    
    // Créer toutes les catégories principales en batch
    console.log(`  📦 Création de ${mainCategories.size} catégories principales...`)
    const mainCatsArray = Array.from(mainCategories).map(name => ({
      name,
      is_active: true,
      handle: toHandle(name)
    }))
    
    const createdMainCategories = await productService.createProductCategories(mainCatsArray)
    
    // Mapper les catégories créées
    createdMainCategories.forEach(cat => {
      categoryMap.set(cat.name, cat)
    })
    
    // Créer toutes les sous-catégories en batch
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
      
      // Mapper les sous-catégories
      createdSubCategories.forEach(cat => {
        // Trouver le nom de la catégorie parente
        const parent = createdMainCategories.find(p => p.id === cat.parent_category_id)
        if (parent) {
          categoryMap.set(`${parent.name} > ${cat.name}`, cat)
        }
      })
    }
    
    console.log(`✅ ${categoryMap.size} catégories créées.`)

    // 4. Préparer et Importer les produits AVEC IMAGES
    const salesChannel = (await salesChannelService.listSalesChannels({ 
      name: "Default Sales Channel" 
    }))[0]
    
    const productsToCreate: any[] = []
    
    for (const row of csvData) {
      const ref = row['Référence']?.trim() || ""
      const title = row['Produit']?.trim() || "Produit sans nom"
      const mainCatName = row['Catégorie Principale']?.trim()
      const subCatName = row['Sous-Catégorie']?.trim()
      const imageUrl = row['Image URL']?.trim() // <-- Récupération de l'image
      
      let categoryToAssign = null
      if (subCatName && mainCatName) {
        categoryToAssign = categoryMap.get(`${mainCatName} > ${subCatName}`)
      } else if (mainCatName) {
        categoryToAssign = categoryMap.get(mainCatName)
      }
      
      const priceAmount = Math.round(parseFloat(row['prix']?.replace(',', '.') || '0') * 100)
      
      // Générer un handle valide et unique
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
      
      // S'assurer que le handle n'est pas vide et ne termine pas par un tiret
      uniqueHandle = uniqueHandle.replace(/-+$/g, '') || `product-${Date.now()}`
      
      // Générer un SKU unique (ne peut pas être vide ou dupliqué)
      const sku = ref && ref.trim() !== "" 
        ? ref.trim() 
        : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // --- GESTION DES IMAGES ---
      // Medusa attend un objet { url: string } pour les images
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
        images: images, // Tableau d'objets { url: string }
        thumbnail: imageUrl && imageUrl !== 'NOT_FOUND' && imageUrl !== '' ? imageUrl : null, // L'URL directe
        options: [{ title: "Type", values: ["Standard"] }],
        variants: [{
          title: "Standard",
          sku: sku,
          options: { "Type": "Standard" },
          prices: [{ amount: priceAmount, currency_code: "mad" }]
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
    }

    console.log(`⚡ Importation de ${productsToCreate.length} produits (avec images)...`)
    const batchSize = 25 // Réduit car les images peuvent ralentir l'import
    for (let i = 0; i < productsToCreate.length; i += batchSize) {
      await productService.createProducts(productsToCreate.slice(i, i + batchSize))
      process.stdout.write(".")
    }

    console.log("\n🎉 TERMINÉ ! La base de données est complète avec les images.")

  } catch (error) {
    console.error("❌ Erreur critique:", error)
  } finally {
    await client.end()
  }
}