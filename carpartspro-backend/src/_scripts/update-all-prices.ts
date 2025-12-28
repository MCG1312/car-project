import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import fs from "fs"

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

export default async function updatePricesSimple({ container }: ExecArgs) {
  console.log("💰 MISE À JOUR DES PRIX (version simplifiée)\n")

  try {
    const query = container.resolve("query")
    
    // 1. Lire le CSV
    const filePath = "import_medusa.csv"
    if (!fs.existsSync(filePath)) {
      throw new Error("❌ Fichier import_medusa.csv introuvable !")
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const csvData = parseCSV(fileContent)
    console.log(`📊 ${csvData.length} lignes lues\n`)

    // 2. Mapping SKU -> Prix
    const skuToPriceMap = new Map<string, number>()
    
    for (const row of csvData) {
      const sku = row['variant_sku']?.trim()
      const priceAmount = parseInt(row['variant_price_amount'] || '0')
      
      if (sku && priceAmount > 0) {
        skuToPriceMap.set(sku, priceAmount)
      }
    }
    
    console.log(`💵 ${skuToPriceMap.size} prix à appliquer\n`)

    // 3. Récupérer les produits sans calculated_price d'abord
    console.log("📦 Analyse des produits existants...")
    
    const { data: productsData } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "variants.*"
      ],
      pagination: {
        take: 2000
      }
    })

    console.log(`✅ ${productsData.length} produits analysés\n`)

    // 4. Pour chaque produit, vérifier s'il a un price_set
    console.log("💰 Vérification des prix...")
    
    const pricingModule = container.resolve(Modules.PRICING)
    const regionModule = container.resolve(Modules.REGION)
    
    // Récupérer la région MAD
    const regions = await regionModule.listRegions()
    const madRegion = regions.find((r: any) => r.currency_code.toLowerCase() === 'mad')
    
    if (!madRegion) {
      throw new Error("❌ Région MAD introuvable")
    }

    let hasPrice = 0
    let noPrice = 0
    const productsNeedingUpdate: any[] = []

    for (const product of productsData) {
      if (!product.variants || product.variants.length === 0) continue
      
      const variant = product.variants[0]
      const expectedPrice = skuToPriceMap.get(variant.sku)
      
      if (!expectedPrice) continue

      // Vérifier si le variant a un price_set
      if (variant.price_set_id) {
        try {
          // Calculer le prix pour cette région
          const calculatedPrices = await pricingModule.calculatePrices(
            { id: [variant.price_set_id] },
            {
              context: {
                currency_code: "mad",
                region_id: madRegion.id
              }
            }
          )
          
          if (calculatedPrices && calculatedPrices.length > 0) {
            const currentPrice = calculatedPrices[0].calculated_amount
            
            if (currentPrice === expectedPrice) {
              hasPrice++
            } else {
              productsNeedingUpdate.push({
                product_id: product.id,
                variant_id: variant.id,
                sku: variant.sku,
                title: product.title,
                current: currentPrice,
                expected: expectedPrice,
                has_price_set: true
              })
            }
          } else {
            noPrice++
            productsNeedingUpdate.push({
              product_id: product.id,
              variant_id: variant.id,
              sku: variant.sku,
              title: product.title,
              current: "Aucun",
              expected: expectedPrice,
              has_price_set: true
            })
          }
        } catch (priceError) {
          noPrice++
          productsNeedingUpdate.push({
            product_id: product.id,
            variant_id: variant.id,
            sku: variant.sku,
            title: product.title,
            current: "Erreur",
            expected: expectedPrice,
            has_price_set: true
          })
        }
      } else {
        noPrice++
        productsNeedingUpdate.push({
          product_id: product.id,
          variant_id: variant.id,
          sku: variant.sku,
          title: product.title,
          current: "Pas de price_set",
          expected: expectedPrice,
          has_price_set: false
        })
      }
      
      process.stdout.write(".")
    }

    console.log("\n\n📊 ANALYSE DES PRIX :")
    console.log(`   ✅ Prix corrects : ${hasPrice}`)
    console.log(`   ❌ Sans prix / prix incorrects : ${productsNeedingUpdate.length}`)
    console.log(`   📝 Total analysé : ${hasPrice + productsNeedingUpdate.length}\n`)

    if (productsNeedingUpdate.length > 0) {
      console.log("🔍 Exemples de produits à corriger (10 premiers) :")
      productsNeedingUpdate.slice(0, 10).forEach(p => {
        console.log(`   - ${p.title} (${p.sku})`)
        if (typeof p.current === 'number') {
          console.log(`     Actuel: ${p.current / 100} MAD`)
        } else {
          console.log(`     Actuel: ${p.current}`)
        }
        console.log(`     Attendu: ${p.expected / 100} MAD`)
        console.log(`     Price set: ${p.has_price_set ? "OUI" : "NON"}\n`)
      })

      console.log("\n⚠️  ACTION REQUISE :")
      console.log(`${productsNeedingUpdate.length} produits nécessitent une correction de prix.\n`)
      console.log("💡 SOLUTIONS :")
      console.log("   1. Réimporter avec master-import.ts (recommandé)")
      console.log("   2. Corriger manuellement dans l'Admin Medusa\n")
    } else {
      console.log("🎉 Tous les prix sont corrects !")
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message)
    console.error(error.stack)
  }
}