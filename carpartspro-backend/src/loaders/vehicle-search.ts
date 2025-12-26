import { MedusaContainer } from "@medusajs/medusa"
import { Logger } from "@medusajs/medusa"
import VehicleService from "../services/vehicle"

type InjectedDependencies = {
  manager: any
  productRepository: any
}

export default async (container: MedusaContainer) => {
  try {
    const { manager, productRepository } = container as unknown as InjectedDependencies
    
    // Enregistrement du service
    container.register("vehicleService", {
      resolve: () => new VehicleService({
        manager,
        productRepository
      })
    })
    
    const logger = container.resolve<Logger>("logger")
    logger.info("Vehicle search module initialized")
  } catch (error) {
    // Gérer l'erreur d'initialisation
    const logger = container.resolve<Logger>("logger")
    logger.error("Failed to initialize vehicle search module", error)
  }
}
