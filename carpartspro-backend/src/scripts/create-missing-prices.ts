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

export default async function nuclearImport({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT) as any
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL) as any
  const regionModuleService = container.resolve(Modules.REGION) as any
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  console.log("💣 IMPORT NUCLÉAIRE - RÉINITIALISATION COMPLÈTE\n")

  try {
    await client.connect()

    const filePath = "import_medusa.csv"
    if (!fs.existsSync(filePath)) throw new Error("❌ CSV introuvable")
    
    const csvData = parseCSV(fs.readFileSync(filePath, 'utf-8'))
    console.log(`📊 ${csvData.length} lignes lues\n`)

    // 1. NETTOYAGE TOTAL
    console.log("🗑️ NETTOYAGE TOTAL de la base...")
    await client.query(`TRUNCATE TABLE "product", "product_category", "product_tag" RESTART IDENTITY CASCADE;`)
    console.log("✅ Base nettoyée\n")
    
    // 2. Catégories
    console.log("📂 Création des catégories...")
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
    console.log(`✅ ${categoryMap.size} catégories créées\n`)

    // 3. Tags
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
    console.log(`✅ ${tagMap.size} tags créés\n`)

    // 4. Région MAD
    const regions = await regionModuleService.listRegions()
    const madRegion = regions.find((r: any) => r.currency_code.toLowerCase() === 'mad')
    if (!madRegion) throw new Error("❌ Région MAD introuvable")
    console.log(`✅ Région MAD: ${madRegion.id}\n`)

    const salesChannel = (await salesChannelService.listSalesChannels({ name: "Default Sales Channel" }))[0]

    // 5. Préparer les produits
    const productsToCreate: any[] = []
    const seenHandles = new Map<string, number>()

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      const title = row['title']?.trim()
      let handle = row['handle']?.trim()
      const sku = row['variant_sku']?.trim()
      
      if (!title || !handle || !sku) continue

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

      // ✅ PRIX : Conversion décimal → centimes
      const priceStr = row['variant_price_amount']?.trim() || '0'
      const priceInMAD = parseFloat(priceStr)
      const priceAmount = Math.round(priceInMAD * 100)
      
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

      productsToCreate.push({
        title,
        handle,
        subtitle,
        description,
        status: "published",
        tags: marketingTags,
        images,
        thumbnail: thumbnail || null,
        categories: categoryToAssign ? [{ id: categoryToAssign.id }] : [],
        options: [{ title: "Type", values: ["Standard"] }],
        metadata: { 
          reference_oem: sku,
          compatibility: { vehicles: parseCarType(subtitle || '') }
        },
        variants: [{ 
          title,
          sku, 
          manage_inventory: true,
          inventory_quantity: stock,
          allow_backorder: false,
          options: { Type: "Standard" },
          prices: [{ 
            amount: priceAmount,
            currency_code: "mad",
            region_id: madRegion.id
          }] 
        }],
        sales_channels: [{ id: salesChannel.id }]
      })
    }

    // 6. Import produit par produit
    console.log(`⚡ Import de ${productsToCreate.length} produits...\n`)
    let imported = 0
    let errors = 0

    for (const product of productsToCreate) {
      try {
        await productModuleService.createProducts(product)
        imported++
        process.stdout.write(".")
        
        if (imported % 50 === 0) {
          console.log(`\n   ✅ ${imported} produits importés...`)
        }
      } catch (error: any) {
        errors++
        if (errors <= 3) {
          console.log(`\n❌ ${product.title}: ${error.message}`)
        }
      }
    }

    console.log("\n\n✅ RÉSUMÉ FINAL :")
    console.log(`   📦 Produits importés : ${imported}`)
    console.log(`   ❌ Erreurs : ${errors}`)
    console.log(`   📂 Catégories : ${categoryMap.size}`)
    console.log(`   🏷️  Tags : ${tagMap.size}`)
    console.log("\n💣 Import nucléaire terminé !")

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
  } finally {
    await client.end()
  }
}