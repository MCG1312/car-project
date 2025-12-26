import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { customFetch } from '@/lib/medusa';

const REGION_ID = "reg_01KCYBHF3PV0D5HHW1NM4RXBQ0";

export default function ProductDetail({ product }) {
  // Ton CartContext est pour l'affichage, pas pour la logique Medusa
  const { addToCart } = useCart(); // On récupère la nouvelle fonction du contexte
  const [selectedVariant, setSelectedVariant] = useState(product?.variants[0]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  if (!product) {
    return (
      <div className="app-container">
        <Header />
        <div style={{color: 'white', padding: '100px', textAlign: 'center'}}>
          <h1 style={{fontSize: '3rem', marginBottom: '20px'}}>Produit introuvable 😞</h1>
          <p style={{color: '#888'}}>Ce produit n'existe pas ou a été supprimé.</p>
          <a href="/products" style={{
            display: 'inline-block',
            marginTop: '30px',
            background: '#D90429',
            color: 'white',
            padding: '15px 40px',
            borderRadius: '50px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>
            ← Retour au catalogue
          </a>
        </div>
        <Footer />
      </div>
    );
  }

   const handleAddToCart = async () => {
  // -----------------------------
    if (!selectedVariant) {
      setError("Veuillez sélectionner une option.");
      return;
    }
    
    setIsAdding(true);
    setError(null);

    try {
      let cartId = localStorage.getItem('cart_id');

      if (!cartId) {
        console.log("Panier inexistant, création via customFetch...");
        const { cart } = await customFetch("/store/carts", "POST", { region_id: REGION_ID });
        cartId = cart.id;
        localStorage.setItem('cart_id', cartId);
      }
      
      await customFetch(`/store/carts/${cartId}/line-items`, "POST", {
        variant_id: selectedVariant.id,
        quantity: 1,
      });

      console.log(`Variant ${selectedVariant.id} ajouté au panier ${cartId}`);
      alert(`✅ ${product.title} ajouté au panier !`);

    } catch (err) {
      console.error("❌ Erreur d'ajout au panier Medusa:", err);
      setError("Impossible d'ajouter au panier. Veuillez réessayer.");
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (variant) => {
    if (!variant || !variant.prices || variant.prices.length === 0) {
      console.warn('⚠️ Pas de prix disponible pour ce variant');
      return "Prix sur demande";
    }

    console.log('💰 Prix disponibles:', variant.prices);

    let priceObj = variant.prices.find(p => 
      p.currency_code && p.currency_code.toLowerCase() === "mad"
    );

    if (!priceObj) {
      console.warn('⚠️ Pas de prix MAD, utilisation du premier prix');
      priceObj = variant.prices[0];
    }

    console.log('✅ Prix sélectionné:', priceObj);

    if (!priceObj.amount && priceObj.amount !== 0) {
      return "Prix sur demande";
    }

    try {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency', 
        currency: priceObj.currency_code.toUpperCase()
      }).format(priceObj.amount / 100);
    } catch (error) {
      console.error('❌ Erreur formatage prix:', error);
      return `${priceObj.amount / 100} ${priceObj.currency_code.toUpperCase()}`;
    }
  };

  const getImage = () => {
    if (product.thumbnail) return product.thumbnail;
    if (product.images && product.images.length > 0) return product.images[0].url;
    return "https://placehold.co/600x400/222/FFF?text=Pas+d'image"; 
  };


  return (
    <div className="app-container">
      <main style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', background: '#050505', minHeight: '80vh' }}>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', gap: '50px', maxWidth: '1000px', flexWrap: 'wrap', width: '100%' }}
        >
          {/* ZONE IMAGE */}
          <div style={{ flex: 1, minWidth: '300px', height: '400px', background: '#222', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
             <img src={getImage()} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* ZONE INFOS */}
          <div style={{ flex: 1, minWidth: '300px', color: 'white' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '10px', lineHeight: '1.1' }}>{product.title}</h1>
            
            <div style={{ fontSize: '2rem', color: '#FFD700', marginBottom: '20px', fontWeight: 'bold' }}>
              {formatPrice(selectedVariant)}
            </div>
            
            <p style={{ lineHeight: '1.6', marginBottom: '20px', color: '#CCC', fontSize: '1.1rem' }}>
              {product.description || "Aucune description disponible."}
            </p>
            
            <div style={{ background: '#1A1A1A', padding: '20px', borderLeft: '4px solid #D90429', marginBottom: '30px', borderRadius: '0 10px 10px 0' }}>
              <strong style={{ color: '#FFF', display: 'block', marginBottom: '10px' }}>Informations :</strong> 
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '5px', color: '#AAA'}}>
                <span>🏷️ Référence : {product.metadata?.reference_oem || "N/A"}</span>
                {product.metadata?.compatibility?.vehicles && (
                  <span>🚗 Compatible : {product.metadata.compatibility.vehicles.map(v => `${v.brand} ${v.model}`).join(', ')}</span>
                )}
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: '#B00321' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={isAdding}
              style={{ 
                background: '#D90429', 
                color: 'white', 
                border: 'none', 
                padding: '18px 50px', 
                fontSize: '1.1rem', 
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 10px 20px rgba(217, 4, 41, 0.3)',
                textTransform: 'uppercase'
              }}
            >
              Ajouter au panier
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params; // Peut être un ID ou un handle
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  try {
    // 1. Récupérer la région MAD
    const regionRes = await fetch(`${backendUrl}/store/regions`, {
      headers: { "x-publishable-api-key": apiKey }
    });
    
    if (!regionRes.ok) {
      console.error("❌ Erreur régions:", regionRes.status);
      return { notFound: true };
    }

    const regionData = await regionRes.json();
    const marocRegion = regionData.regions.find(r => 
      r.currency_code && r.currency_code.toLowerCase() === 'mad'
    );
    
    if (!marocRegion) {
      console.error("⚠️ Région MAD introuvable");
      return { notFound: true };
    }

    console.log("✅ Région MAD:", marocRegion.id);

    // 2. Essayer de récupérer le produit
    let product = null;

    // MÉTHODE 1: Essayer par ID direct
    if (id.startsWith('prod_')) {
      console.log(`🔍 Tentative par ID: ${id}`);
      const productUrl = `${backendUrl}/store/products/${id}?region_id=${marocRegion.id}`;
      
      const res = await fetch(productUrl, {
        headers: { "x-publishable-api-key": apiKey }
      });

      if (res.ok) {
        const data = await res.json();
        product = data.product;
        console.log("✅ Produit trouvé par ID");
      }
    }

    // MÉTHODE 2: Si échec, essayer par handle (slug)
    if (!product) {
      console.log(`🔍 Tentative par handle: ${id}`);
      const listUrl = `${backendUrl}/store/products?handle=${id}`;
      
      const res = await fetch(listUrl, {
        headers: { "x-publishable-api-key": apiKey }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          const foundProduct = data.products[0];
          console.log("✅ Produit trouvé par handle, ID:", foundProduct.id);
          
          // ✅ CORRECTION: Faire une 2ème requête avec l'ID pour avoir les prix
          const productUrl = `${backendUrl}/store/products/${foundProduct.id}?region_id=${marocRegion.id}`;
          const detailRes = await fetch(productUrl, {
            headers: { "x-publishable-api-key": apiKey }
          });
          
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            product = detailData.product;
            console.log("✅ Détails + prix récupérés");
          } else {
            product = foundProduct; // Fallback sans prix
          }
        }
      }
    }

    // Si toujours pas trouvé, retourner 404
    if (!product) {
      console.error(`❌ Produit non trouvé: ${id}`);
      return { notFound: true };
    }

    // Debug des prix
    if (product.variants?.[0]?.prices) {
      console.log("💰 Prix reçus:", JSON.stringify(product.variants[0].prices, null, 2));
    } else {
      console.warn("⚠️ Aucun prix dans la réponse");
    }

    return {
      props: { product }
    };

  } catch (error) {
    console.error("❌ Erreur critique:", error);
    return { notFound: true };
  }
}