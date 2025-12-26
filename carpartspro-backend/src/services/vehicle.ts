// src/services/vehicle.ts
import { Product } from "@medusajs/medusa"
import { MedusaError } from "@medusajs/utils"
import { EntityManager } from "typeorm"
import { ProductRepository } from "@medusajs/medusa/dist/repositories/product"

type InjectedDependencies = {
  manager: EntityManager
  productRepository: typeof ProductRepository
}

type FindCompatibleProductsInput = {
  brand: string
  model: string
  year: number
}

export default class VehicleService {
  static resolutionKey = 'vehicleService'
  
  protected readonly manager_: EntityManager
  protected readonly productRepository_: typeof ProductRepository

  constructor({ manager, productRepository }: InjectedDependencies) {
    this.manager_ = manager
    this.productRepository_ = productRepository
  }

  async findCompatibleProducts({ brand, model, year }: FindCompatibleProductsInput): Promise<Product[]> {
    if (!brand || !model || !year) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Brand, model and year are required"
      )
    }

    const productRepo = this.manager_.withRepository(this.productRepository_)
    
    return productRepo
      .createQueryBuilder("product")
      .where("product.metadata->'compatibility'->'vehicles' @> :criteria", {
        criteria: JSON.stringify([{ brand, model, year }])
      })
      .getMany()
  }
}