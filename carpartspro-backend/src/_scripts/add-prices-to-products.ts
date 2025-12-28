import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import fs from "fs"
import { Client } from "pg"

const toHandle = (str: string) => {
  if (!str || str.trim() === "") return ""
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
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

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const headers = parseCSVLine(lines[0])
  const rows: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]
      })
      rows.push(row)
    }
  }
  
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

export default async function masterImport({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT) as any
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL) as any
  const regionModuleService = container.resolve(Modules.REGION) as any
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  console.log("🚀 Lancement de l'import FINAL (format CSV Medusa)...")

  try {
    await client.connect()

    const filePath = "import_medusa.csv"
    if (!fs.existsSync(filePath)) throw new Error("❌ Fichier import_medusa.csv introuvable !")
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const csvData = parseCSV(fileContent)
    
    if (csvData.length === 0) {
      throw new Error("❌ Aucune donnée lue. Vérifiez le format du CSV.")
    }

    console.log(`📊 ${csvData.length} lignes lues`)

    console.log("🗑️ Nettoyage complet de la base de données...")
    try {
      await client.query(`
        TRUNCATE TABLE "product", "product_category", "product_tag" RESTART IDENTITY CASCADE;
      `)
      console.log("✅ Base nettoyée complètement.")
    } catch (cleanError: any) {
      console.log("⚠️  Erreur de nettoyage (peut être ignorée si première exécution):", cleanError.message)
    }
    
    console.log("🛠️  Création des catégories...")
    const categoryMap = new Map<string, any>()
    
    for (const row of csvData) {
      const categoriesPath = row['categories']?.trim()
      if (!categoriesPath) continue
      
      const parts = categoriesPath.split('/')
      const mainCatName = parts[0]?.trim()
      const subCatName = parts[1]?.trim()
      
      if (mainCatName && !categoryMap.has(mainCatName)) {
        const category = await productModuleService.createProductCategories({
          name: mainCatName,
          is_active: true,
          handle: toHandle(mainCatName)
        })
        categoryMap.set(mainCatName, category)
      }
      
      if (subCatName && !categoryMap.has(`${mainCatName} > ${subCatName}`)) {
        const parentCategory = categoryMap.get(mainCatName)
        const subCategory = await productModuleService.createProductCategories({
          name: subCatName,
          parent_category_id: parentCategory.id,
          is_active: true,
          handle: `${toHandle(mainCatName)}-${toHandle(subCatName)}`
        })
        categoryMap.set(`${mainCatName} > ${subCatName}`, subCategory)
      }
    }
    console.log(`✅ ${categoryMap.size} catégories créées.`)

    console.log("🏷️  Création des tags...")
    const tagMap = new Map<string, any>()
    const allTagValues = new Set<string>()
    
    for (const row of csvData) {
      const tagsStr = row['tags']?.trim() || ''
      if (tagsStr) {
        tagsStr.split(',').forEach(t => {
          const tagValue = t.trim()
          if (tagValue) allTagValues.add(tagValue)
        })
      }
    }
    
    for (const tagValue of allTagValues) {
      const tag = await productModuleService.createProductTags({ value: tagValue })
      tagMap.set(tagValue, tag)
    }
    console.log(`✅ ${tagMap.size} tags créés.`)

    // ✅ RÉCUPÉRER LA RÉGION MAD
    console.log("🌍 Récupération de la région MAD...")
    const regions = await regionModuleService.listRegions()
    const madRegion = regions.find((r: any) => r.currency_code.toLowerCase() === 'mad')
    
    if (!madRegion) {
      throw new Error("❌ Région MAD introuvable ! Créez-la dans l'Admin Medusa.")
    }
    
    console.log(`✅ Région MAD trouvée: ${madRegion.id}`)

    const salesChannel = (await salesChannelService.listSalesChannels({ name: "Default Sales Channel" }))[0]
    const productsToCreate: any[] = []
    const skippedProducts: any[] = []
    const seenHandles = new Map<string, number>() // Pour suivre les handles et leur compteur

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      const title = row['title']?.trim()
      let handle = row['handle']?.trim()
      const sku = row['variant_sku']?.trim()
      
      if (!title || !handle || !sku) {
        skippedProducts.push({
          ligne: i + 2,
          raison: "Titre, Handle ou SKU manquant",
          titre: title || "N/A",
          handle: handle || "N/A"
        })
        continue
      }

      // ✅ CORRECTION 1: Gérer les handles dupliqués avec compteur
      handle = handle.replace(/'/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "")
      
      if (seenHandles.has(handle)) {
        const count = seenHandles.get(handle)! + 1
        seenHandles.set(handle, count)
        handle = `${handle}-${count}`
      } else {
        seenHandles.set(handle, 0)
      }

      const categoriesPath = row['categories']?.trim()
      let categoryToAssign = null
      if (categoriesPath) {
        const parts = categoriesPath.split('/')
        const mainCat = parts[0]?.trim()
        const subCat = parts[1]?.trim()
        
        if (subCat) {
          categoryToAssign = categoryMap.get(`${mainCat} > ${subCat}`)
        } else if (mainCat) {
          categoryToAssign = categoryMap.get(mainCat)
        }
      }

      const priceAmount = parseInt(row['variant_price_amount'] || '0')
      const thumbnail = row['thumbnail']?.trim()
      const images = thumbnail && thumbnail !== '' ? [{ url: thumbnail }] : []
      
      const tagsStr = row['tags']?.trim() || ''
      const allTags = tagsStr.split(',').map(t => t.trim()).filter(t => t)
      
      const marketingTags = allTags.filter(tag => {
        const isCarCode = /^[PCR]\.\w+/i.test(tag) || /^\d{3,4}$/i.test(tag)
        return !isCarCode
      }).map(tagValue => {
        const tag = tagMap.get(tagValue)
        return tag ? { id: tag.id } : null
      }).filter(Boolean)
      
      const stock = parseInt(row['variant_inventory_quantity'] || '0')
      const description = row['description']?.trim() || null
      const subtitle = row['subtitle']?.trim() || null
      const seoTitle = row['metadata_seo_title']?.trim() || `${title} - CarPartsPro Maroc`
      const seoDescription = row['metadata_seo_description']?.trim() || `Achetez ${title} au meilleur prix.`

      // ✅ CORRECTION FINALE: Utiliser "Type" comme option standard
      productsToCreate.push({
        title: title,
        handle: handle,
        subtitle: subtitle,
        description: description,
        status: "published",
        tags: marketingTags,
        images: images,
        thumbnail: thumbnail || null,
        categories: categoryToAssign ? [{ id: categoryToAssign.id }] : [],
        // ✅ Option simple et standard
        options: [
          {
            title: "Type",
            values: ["Standard"]
          }
        ],
        metadata: { 
          reference_oem: sku,
          compatibility: { vehicles: parseCarType(subtitle || '') },
          seo_title: seoTitle,
          seo_description: seoDescription
        },
        variants: [{ 
          title: title,
          sku: sku, 
          manage_inventory: true,
          inventory_quantity: stock,
          allow_backorder: false,
          // ✅ IMPORTANT: La clé doit correspondre à options[].title
          options: {
            Type: "Standard"
          },
          prices: [{ 
            amount: priceAmount, 
            currency_code: "mad",
            region_id: madRegion.id
          }] 
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
    }

    if (skippedProducts.length > 0) {
      console.log(`\n⚠️  ${skippedProducts.length} produits ignorés :`)
      skippedProducts.slice(0, 5).forEach(p => {
        console.log(`   Ligne ${p.ligne}: ${p.raison}`)
        console.log(`     Titre: "${p.titre}", Handle: "${p.handle}"`)
      })
      if (skippedProducts.length > 5) {
        console.log(`   ... et ${skippedProducts.length - 5} autres`)
      }
    }

    console.log(`\n⚡ Importation de ${productsToCreate.length} produits...`)
    const batchSize = 25
    let importedCount = 0
    let errorCount = 0
    const errorDetails: any[] = []
    
    for (let i = 0; i < productsToCreate.length; i += batchSize) {
      const batch = productsToCreate.slice(i, i + batchSize)
      try {
        await productModuleService.createProducts(batch)
        importedCount += batch.length
        process.stdout.write(".")
      } catch (error: any) {
        // En cas d'erreur batch, essayer produit par produit
        for (const product of batch) {
          try {
            await productModuleService.createProducts([product])
            importedCount++
            process.stdout.write(".")
          } catch (singleError: any) {
            errorCount++
            errorDetails.push({
              handle: product.handle,
              title: product.title,
              error: singleError.message
            })
          }
        }
      }
    }

    console.log("\n\n✅ RÉSUMÉ :")
    console.log(`   📦 Produits importés : ${importedCount}`)
    console.log(`   ❌ Produits en erreur : ${errorCount}`)
    console.log(`   ⚠️  Produits ignorés (CSV) : ${skippedProducts.length}`)
    console.log(`   📂 Catégories créées : ${categoryMap.size}`)
    console.log(`   🏷️  Tags créés : ${tagMap.size}`)
    
    if (errorCount > 0 && errorDetails.length > 0) {
      console.log("\n❌ Détails des erreurs (5 premières) :")
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`   ${err.handle}: ${err.error.substring(0, 100)}`)
      })
    }
    
    console.log("\n🎉 TERMINÉ ! La base de données est complète et à jour.")

  } catch (error) {
    console.error("❌ Erreur critique:", error)
  } finally {
    await client.end()
  }
}