import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

// 1. IMPORTE TA FONCTION customFetch
import { customFetch } from '@/lib/medusa'; // Assure-toi que le chemin est bon

export default function CartPage() {
  // On utilise uniquement l'état local de cette page
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 2. FONCTION POUR CHARGER LE PANIER VIA customFetch
  const fetchCart = async () => {
    const cartId = localStorage.getItem('cart_id');
    if (!cartId) {
      setLoading(false);
      return;
    }
    try {
      // On appelle l'endpoint pour récupérer un panier
      const { cart: cartData } = await customFetch(`/store/carts/${cartId}`);
      setCart(cartData);
    } catch (error) {
      console.error("Erreur récupération panier:", error);
      localStorage.removeItem('cart_id');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 3. FONCTIONS D'INTERACTION VIA customFetch
  const handleRemoveItem = async (lineItemId) => {
    if (!cart) return;
    try {
      const { cart: updatedCart } = await customFetch(`/store/carts/${cart.id}/line-items/${lineItemId}`, "DELETE");
      setCart(updatedCart);
    } catch (error) {
      console.error("Erreur suppression article:", error);
    }
  };

  const handleUpdateQuantity = async (lineItemId, quantity) => {
    if (!cart || quantity < 1) return;
    try {
      const { cart: updatedCart } = await customFetch(`/store/carts/${cart.id}/line-items/${lineItemId}`, "POST", { quantity });
      setCart(updatedCart);
    } catch (error) {
      console.error("Erreur mise à jour quantité:", error);
    }
  };
  
  // Fonction pour formater les prix
  const formatPrice = (amount, currencyCode) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currencyCode.toUpperCase()
    }).format(amount / 100);
  };

  // AFFICHAGE PENDANT LE CHARGEMENT
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Chargement...</div>;
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <main style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '40px' }}>VOTRE <span style={{ color: '#D90429' }}>PANIER</span></h1>

        {!cart || cart.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <h2 style={{ color: '#888' }}>Votre panier est vide.</h2>
            <Link href="/products" style={{ display: 'inline-block', marginTop: '20px', color: '#FFD700', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.2rem' }}>
              Commencer vos achats →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap-reverse' }}>
            {/* Colonne des articles */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
              {cart.items.map((item) => (
                <motion.div 
                  layout key={item.id} 
                  style={{ display: 'flex', alignItems: 'center', background: '#1A1A1A', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}
                >
                  <div style={{ width: '100px', height: '100px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginRight: '20px' }}>
                    <img src={item.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '5px' }}>{item.title}</h3>
                    <p style={{ color: '#888' }}>Prix unitaire: {formatPrice(item.unit_price, cart.region.currency_code)}</p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                      style={{ width: '60px', padding: '5px', textAlign: 'center', background: '#333', border: '1px solid #555', color: 'white' }}
                    />
                    <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#AAA', cursor: 'pointer', fontSize: '0.9rem' }}>Supprimer</button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Colonne du résumé */}
            <div style={{ flex: 1, background: '#1A1A1A', padding: '30px', borderRadius: '10px', height: 'fit-content', minWidth: '300px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>Résumé</h2>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#AAA'}}>
                <span>Sous-total</span>
                <span>{formatPrice(cart.subtotal, cart.region.currency_code)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '25px', color: '#AAA'}}>
                <span>Livraison</span>
                <span>Calculée à l'étape suivante</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold'}}>
                <span>Total</span>
                <span style={{color: '#FFD700'}}>{formatPrice(cart.total, cart.region.currency_code)}</span>
              </div>
              <button 
                onClick={() => router.push('/checkout')}
                style={{ background: '#D90429', color: 'white', border: 'none', padding: '15px 50px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer', width: '100%', marginTop: '30px' }}
              >
                PASSER LA COMMANDE
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}