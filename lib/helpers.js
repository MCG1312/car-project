// utils/helpers.js

// 1. Formater le prix (Centimes -> MAD)
export const formatPrice = (variant) => {
  if (!variant || !variant.prices || variant.prices.length === 0) return "Prix indisponible"
  
  // On cherche le prix en MAD, sinon on prend le premier
  const priceObj = variant.prices.find(p => p.currency_code === "mad") || variant.prices[0]
  
  // Medusa stocke en centimes (45000 = 450.00)
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: priceObj.currency_code.toUpperCase()
  }).format(priceObj.amount / 100)
}

// 2. Gestion des images (Placeholder si pas d'image)
export const getProductImage = (product) => {
  if (product.thumbnail) return product.thumbnail
  if (product.images && product.images.length > 0) return product.images[0].url
  return "https://placehold.co/400x300?text=Pas+d'image" // Image par défaut
}