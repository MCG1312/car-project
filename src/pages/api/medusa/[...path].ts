// pages/api/medusa/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';

const MEDUSA_BACKEND_URL = "http://localhost:9000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ message: "Chemin invalide" });
  }

  const pathString = path.join('/');
  const queryObj = { ...req.query };
  delete queryObj.path;
  const queryString = new URLSearchParams(queryObj as any).toString();
  const url = `${MEDUSA_BACKEND_URL}/${pathString}${queryString ? `?${queryString}` : ''}`;

  console.log(`🍪 Proxy: ${req.method} ${url}`);

  try {
    const body = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : undefined;

    const headers: any = {
      "Content-Type": "application/json",
      "x-publishable-api-key": req.headers['x-publishable-api-key'] || "",
    };

    // 1. AJOUT CRUCIAL : On définit l'Origin pour que Medusa accepte de créer le cookie
    headers["Origin"] = MEDUSA_BACKEND_URL; 
    
    // 2. Transmission du cookie entrant
    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: body,
      cache: 'no-store',
    });

    // Lecture réponse
    let data = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
    }

    // 3. RECUPERATION DES COOKIES (Méthode robuste pour Node.js)
    // Medusa peut envoyer plusieurs cookies, on utilise getSetCookie() si dispo
    let cookies = [];
    if (typeof response.headers.getSetCookie === 'function') {
      cookies = response.headers.getSetCookie();
    } else {
      // Fallback pour vieilles versions de Node
      const headerVal = response.headers.get('set-cookie');
      if (headerVal) cookies = [headerVal];
    }

    if (cookies.length > 0) {
      console.log(`   ✅ BINGO ! ${cookies.length} Cookie(s) reçu(s) de Medusa !`);
      
      // On nettoie CHAQUE cookie pour localhost
      const cleanedCookies = cookies.map(cookie => 
        cookie
          .replace(/Domain=[^;]+;/gi, "") 
          .replace(/; Secure/gi, "")
          .replace(/SameSite=None/gi, "SameSite=Lax")
      );

      // On renvoie le tableau complet au navigateur
      res.setHeader('Set-Cookie', cleanedCookies);
    } else {
      console.log("   ❌ Aucun cookie 'Set-Cookie' reçu du backend.");
    }

    return res.status(response.status).json(data);

  } catch (error: any) {
    console.error("❌ Erreur Proxy:", error);
    return res.status(500).json({ message: "Erreur interne Proxy" });
  }
}