import { ExecArgs } from "@medusajs/framework/types"
import fs from "fs"
import csv from "csv-parser"

export default async function debugCSV({ container }: ExecArgs) {
  const csvData: any[] = []
  const filePath = "import_medusa.csv"

  await new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (d) => csvData.push(d))
      .on('end', resolve)
  })

  console.log("\n📋 DIAGNOSTIC DU CSV\n")
  console.log(`Nombre de lignes lues : ${csvData.length}\n`)

  if (csvData.length > 0) {
    console.log("🔍 COLONNES DÉTECTÉES :")
    const columns = Object.keys(csvData[0])
    columns.forEach((col, i) => {
      console.log(`   ${i + 1}. "${col}"`)
    })

    console.log("\n📊 PREMIÈRE LIGNE DE DONNÉES :")
    const firstRow = csvData[0]
    Object.entries(firstRow).forEach(([key, value]) => {
      console.log(`   ${key}: "${value}"`)
    })

    console.log("\n📊 DEUXIÈME LIGNE DE DONNÉES :")
    if (csvData[1]) {
      const secondRow = csvData[1]
      Object.entries(secondRow).forEach(([key, value]) => {
        console.log(`   ${key}: "${value}"`)
      })
    }
  }
}