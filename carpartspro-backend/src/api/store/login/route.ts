// src/api/store/login/route.ts

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import jwt from "jsonwebtoken";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, password } = req.body as Record<string, string>;
  
  console.log(`👉 Tentative de login JWT pour : ${email}`);
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("❌ ERREUR FATALE : JWT_SECRET n'est pas défini !");
    return res.status(500).json({ message: "Erreur de configuration serveur." });
  }
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }
  
  try {
    const authModule = req.scope.resolve(Modules.AUTH);
    
    const { success, authIdentity } = await authModule.authenticate('emailpass', {
      body: { email, password }
    });

    if (!success) {
      throw new Error("Authentification échouée: Identifiants invalides.");
    }
    
    // --- LA CORRECTION EST ICI ---
    // On extrait l'ID du client depuis les métadonnées de l'application
    const customerId = authIdentity.app_metadata?.customer_id;
    // ----------------------------
    
    if (!customerId) {
        throw new Error("Authentification réussie mais le customer_id est manquant dans app_metadata.");
    }

    const customerModule = req.scope.resolve(Modules.CUSTOMER);
    const customer = await customerModule.retrieveCustomer(customerId);

    const token = jwt.sign({ customer_id: customer.id }, jwtSecret, { expiresIn: "7d" });
      
    console.log(`✅ Login JWT réussi pour ${email} (ID: ${customer.id})`);
    return res.status(200).json({ token });

  } catch (error) {
    console.error("❌ Erreur d'authentification Medusa V2 :", error);
    return res.status(401).json({ message: error.message || "Email ou mot de passe incorrect." });
  }
}