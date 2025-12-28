import { ProductStatus } from "@medusajs/framework/utils"

type ProductSeedData = {
  title: string
  reference_oem: string
  variants: {
    title: string
    sku: string
    prices: {
      currency_code: string
      amount: number
    }[]
  }[]
  metadata?: Record<string, unknown>
}

const products: ProductSeedData[] = [
  {
    title: "Filtre à Huile Sport",
    reference_oem: "REF-12345",
    metadata: {
      compatibility: [
        { brand: "Renault", model: "Clio IV", engine: "1.5 dCi" }
      ]
    },
    variants: [
      {
        title: "Filtre à Huile Sport - Standard",
        sku: "FILT-HUIL-SPORT-001",
        prices: [
          {
            currency_code: "eur",
            amount: 1500,
          },
        ],
      },
    ],
  }
]

export default async function seedProduct({ 
  container 
}: { 
  container: any 
}) {
  const productService = container.resolve("productService")
  const variantService = container.resolve("productVariantService")
  const priceService = container.resolve("priceService")

  for (const productData of products) {
    // Create product
    const product = await productService.create({
      title: productData.title,
      reference_oem: productData.reference_oem,
      status: ProductStatus.PUBLISHED,
      metadata: productData.metadata || {},
    })

    // Create variants
    for (const variantData of productData.variants) {
      const variant = await variantService.create(product.id, {
        title: variantData.title,
        sku: variantData.sku,
        prices: variantData.prices,
      })
    }
  }
}