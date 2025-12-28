// src/services/vehicle.ts
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { IProductModuleService, ProductDTO } from "@medusajs/framework/types"

type FindCompatibleProductsInput = {
  brand: string
  model: string
  year: number
}

type VehicleCompatibility = {
  brand: string
  model: string
  year: number
}

class VehicleService {
  protected productModuleService_: IProductModuleService

  constructor(container: any) {
    this.productModuleService_ = container.resolve(Modules.PRODUCT)
  }

  async findCompatibleProducts({ 
    brand, 
    model, 
    year 
  }: FindCompatibleProductsInput): Promise<ProductDTO[]> {
    if (!brand || !model || !year) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Brand, model and year are required"
      )
    }

    // listAndCountProducts retourne [products, count]
    const [products, count] = await this.productModuleService_.listAndCountProducts(
      {}, 
      {
        relations: ["variants", "images"],
        take: 1000,
      }
    )

    // Filtrage en JavaScript avec type guard
    const compatibleProducts = products.filter((product: ProductDTO) => {
      // Type guard pour metadata
      if (!product.metadata || typeof product.metadata !== 'object') {
        return false
      }

      const metadata = product.metadata as Record<string, any>
      const compatibility = metadata.compatibility
      
      if (!compatibility || typeof compatibility !== 'object') {
        return false
      }

      const vehicles = (compatibility as Record<string, any>).vehicles
      
      if (!Array.isArray(vehicles)) {
        return false
      }
      
      return vehicles.some((vehicle: any) => 
        vehicle.brand?.toLowerCase() === brand.toLowerCase() && 
        vehicle.model?.toLowerCase() === model.toLowerCase() && 
        vehicle.year === year
      )
    })

    return compatibleProducts
  }
}

export default VehicleService