import { Product } from "@medusajs/medusa"

declare module "@medusajs/medusa" {
  class Product {
    reference_oem?: string
  }
}

export {}
