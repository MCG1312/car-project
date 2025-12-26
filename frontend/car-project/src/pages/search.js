import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { formatPrice, getProductImage } from "@/lib/helpers" // Importe tes helpers

export default function SearchPage() {
  const router = useRouter()
  const { brand, model, year } = router.query // Récupère les paramètres URL

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On attend que le routeur soit prêt (Next.js quirk)
    if (!router.isReady) return

    const fetchProducts = async () => {
      setLoading(true)
      try {
        // Construction de l'URL pour ton API custom
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        let url = `${baseUrl}/store/vehicle-search?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`
        if (year) url += `&year=${year}`

        const res = await fetch(url, {
          headers: {
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
          }
        })
        
        const data = await res.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error("Erreur chargement produits:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [router.isReady, brand, model, year])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Résultats pour : {brand} {model} {year}
      </h1>

      {loading ? (
        <p>Chargement des pièces compatibles...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-10">
          <p>Aucune pièce trouvée pour ce véhicule.</p>
          <button onClick={() => router.push('/')} className="text-blue-500 underline">Retour</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link href={`/products/${product.id}`} key={product.id} className="border p-4 rounded hover:shadow-lg transition">
              {/* Image */}
              <div className="h-48 bg-gray-100 mb-4 flex items-center justify-center">
                <img 
                  src={getProductImage(product)} 
                  alt={product.title} 
                  className="max-h-full object-contain"
                />
              </div>
              
              {/* Infos */}
              <h2 className="font-bold text-lg">{product.title}</h2>
              <p className="text-sm text-gray-500 mb-2">Ref: {product.metadata?.reference_oem}</p>
              
              {/* Prix (Calculé via le helper) */}
              <p className="text-xl font-bold text-red-600">
                {formatPrice(product.variants[0])}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}