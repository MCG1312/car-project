import { Product } from "@medusajs/medusa"

declare module "@medusajs/medusa" {
  declare class Product {
    reference_oem?: string
  }
}

export {}
