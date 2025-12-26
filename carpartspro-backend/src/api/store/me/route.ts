// src/api/store/me/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import jwt from "jsonwebtoken";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const authHeader = req.headers.authorization;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("❌ ERREUR FATALE : JWT_SECRET n'est pas défini dans le fichier .env !");
    return res.status(500).json({ message: "Erreur de configuration interne du serveur." });
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant ou mal formaté." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === 'object' && decoded !== null && 'customer_id' in decoded) {
      const customerId = decoded.customer_id as string;
      
      // Récupérer le customer
      const customerModule = req.scope.resolve(Modules.CUSTOMER);
      const customer = await customerModule.retrieveCustomer(customerId, {
        relations: ["addresses"],
      });

      if (!customer) {
        return res.status(404).json({ message: "Client non trouvé." });
      }

      // Récupérer les commandes du client
      const orderModule = req.scope.resolve(Modules.ORDER);
      const orders = await orderModule.listOrders({
        customer_id: customerId,
      });

      console.log(`✅ Récupération du profil pour customer_id: ${customerId}`);

      return res.status(200).json({ 
        customer: {
          ...customer,
          orders: orders, // Ajouter les commandes au résultat
        }
      });
    } else {
      throw new Error("Token payload invalide.");
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification du token:", error.message);
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}