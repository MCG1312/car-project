// lib/medusa.ts

const BACKEND_URL = "http://localhost:3000/api/medusa";
// Remplace par ta VRAIE clé publique commençant par pk_
const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_f73a6c1d815debd5454fcfa0ea2aa554e00b6c7c2c746695425f2774ac0026a0"; 

// On ajoute un argument 'customHeaders' à la fin
export async function customFetch(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json",
    "x-publishable-api-key": API_KEY,
  };

  // --- C'EST LE CHANGEMENT MAJEUR ---
  // On récupère le token du LocalStorage
  const token = localStorage.getItem('jwt_token');
  if (token) {
    // S'il existe, on l'ajoute à l'en-tête Authorization
    headers['Authorization'] = `Bearer ${token}`;
  }
  // ------------------------------------

  const options: RequestInit = { 
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur API: ${res.status}`);
  }

  // Si la réponse est vide (ex: 204 No Content), on ne crashe pas
  if (res.status === 204) return null;
  
  return res.json();
}

// 1. Récupérer les options pour les menus (Marques, Modèles)
export async function getVehicleOptions(type, brand, model) {
  let url = `/store/vehicle-options?type=${type}`
  if (brand) url += `&brand=${encodeURIComponent(brand)}`
  if (model) url += `&model=${encodeURIComponent(model)}`
  
  return customFetch(url)
}

// 2. Chercher les produits compatibles
export async function searchCompatibleProducts(brand, model, year) {
  const url = `/store/vehicle-search?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${year}`
  return customFetch(url)
}