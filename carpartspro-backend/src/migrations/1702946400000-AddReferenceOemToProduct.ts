import { Migration } from "@medusajs/medusa"
import { DataSource } from "typeorm"

export default async function AddReferenceOemToProduct({ 
  dataSource 
}: { dataSource: DataSource }) {
  const query = `
    ALTER TABLE "product" 
    ADD COLUMN IF NOT EXISTS "reference_oem" TEXT;
  `
  await dataSource.query(query)
}