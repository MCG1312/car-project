// pages/checkout.js

import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/medusa';

const inputStyle = {
  width: '100%',
  padding: '15px',
  background: '#222',
  border: '1px solid #444',
  borderRadius: '5px',
  color: 'white',
  outline: 'none',
  fontSize: '1rem'
};

export default function Checkout() {
  const { cart, loading, refreshCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [shippingInfo, setShippingInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address_1: '',
    city: '',
    postal_code: '',
    phone: ''
  });

  useEffect(() => {
    if (cart) {
      const addr = cart.shipping_address;
      setShippingInfo({
        first_name: cart.customer?.first_name || addr?.first_name || '',
        last_name: cart.customer?.last_name || addr?.last_name || '',
        email: cart.email || cart.customer?.email || '',
        address_1: addr?.address_1 || '',
        city: addr?.city || '',
        postal_code: addr?.postal_code || '',
        phone: addr?.phone || ''
      });
    }
  }, [cart]);

  const handleInfoChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const formatPrice = (amount, currencyCode) => {
    const code = currencyCode ? currencyCode.toUpperCase() : "MAD";
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: code
    }).format(amount / 100);
  };

  // ✅ FONCTION MISE À JOUR POUR MEDUSA V2
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    if (!cart) {
      setError("Votre panier est introuvable. Veuillez rafraîchir la page.");
      setIsProcessing(false);
      return;
    }

    try {
      // ÉTAPE 1: Mettre à jour l'adresse et l'email du panier
      console.log("Étape 1/5: Mise à jour des informations du panier...");
      await customFetch(`/store/carts/${cart.id}`, 'POST', {
        email: shippingInfo.email,
        shipping_address: {
          first_name: shippingInfo.first_name,
          last_name: shippingInfo.last_name,
          address_1: shippingInfo.address_1,
          city: shippingInfo.city,
          postal_code: shippingInfo.postal_code,
          phone: shippingInfo.phone,
          country_code: 'ma'
        }
      });

      // ÉTAPE 2: Sélectionner une option de livraison
      console.log("Étape 2/5: Sélection de la méthode de livraison...");
      const { shipping_options } = await customFetch(`/store/shipping-options?cart_id=${cart.id}`);
      if (!shipping_options?.length) {
        throw new Error("Aucune méthode de livraison disponible pour votre adresse.");
      }
      await customFetch(`/store/carts/${cart.id}/shipping-methods`, 'POST', {
        option_id: shipping_options[0].id,
      });

      // ✅ ÉTAPE 3 (NOUVEAU POUR V2): Créer une payment collection
      console.log("Étape 3/5: Création de la payment collection...");
      const { payment_collection } = await customFetch(`/store/payment-collections`, 'POST', {
        cart_id: cart.id
      });

      // ✅ ÉTAPE 4 (NOUVEAU POUR V2): Initialiser une session de paiement
      console.log("Étape 4/5: Création de la session de paiement (COD)...");
      await customFetch(
        `/store/payment-collections/${payment_collection.id}/payment-sessions`, 
        'POST', 
        {
          provider_id: 'pp_system_default' // Provider manuel par défaut
        }
      );
      
      // ÉTAPE 5: Finaliser la commande
      console.log("Étape 5/5: Finalisation de la commande...");
      const { order } = await customFetch(`/store/carts/${cart.id}/complete`, 'POST');

      // Succès !
      console.log("✅ COMMANDE PASSÉE !", order);
      localStorage.removeItem('cart_id');
      if (refreshCart) refreshCart();
      router.push(`/success?order_id=${order.id}`);

    } catch (err) {
      console.error("❌ Erreur lors de la finalisation de la commande:", err);
      setError(err.message || "Une erreur est survenue. Veuillez vérifier vos informations et réessayer.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Chargement...</div>;
  }
  if (!cart || cart.items.length === 0) {
    if (typeof window !== 'undefined') router.push('/cart');
    return null;
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <main style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap-reverse' }}>
        
        {/* Colonne gauche : Formulaire */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>LIVRAISON & PAIEMENT</h1>
          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <h3 style={{ color: '#D90429', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Informations de Livraison</h3>
            
            <div style={{ display: 'flex', gap: '20px' }}>
              <input required name="first_name" value={shippingInfo.first_name} onChange={handleInfoChange} type="text" placeholder="Prénom" style={inputStyle} />
              <input required name="last_name" value={shippingInfo.last_name} onChange={handleInfoChange} type="text" placeholder="Nom" style={inputStyle} />
            </div>
            <input required name="email" value={shippingInfo.email} onChange={handleInfoChange} type="email" placeholder="Email" style={inputStyle} />
            <input required name="phone" value={shippingInfo.phone} onChange={handleInfoChange} type="tel" placeholder="Téléphone" style={inputStyle} />
            <input required name="address_1" value={shippingInfo.address_1} onChange={handleInfoChange} type="text" placeholder="Adresse" style={inputStyle} />
            <div style={{ display: 'flex', gap: '20px' }}>
              <input required name="city" value={shippingInfo.city} onChange={handleInfoChange} type="text" placeholder="Ville" style={inputStyle} />
              <input required name="postal_code" value={shippingInfo.postal_code} onChange={handleInfoChange} type="text" placeholder="Code Postal" style={inputStyle} />
            </div>

            <div style={{ background: '#1A1A1A', padding: '20px', borderLeft: '4px solid #FFD700', marginTop: '20px', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ color: '#FFF' }}>Méthode de paiement</strong>
              <p style={{ color: '#AAA', marginTop: '5px' }}>Vous paierez en espèces à la livraison.</p>
            </div>
            
            {error && <p style={{ color: 'red', marginTop: '10px', background: 'rgba(217, 4, 41, 0.1)', padding: '10px', borderRadius: '5px', border: '1px solid #D90429' }}>{error}</p>}

            <button type="submit" disabled={isProcessing} style={{ marginTop: '30px', padding: '15px', background: isProcessing ? '#555' : '#D90429', color: 'white', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: isProcessing ? 'wait' : 'pointer', borderRadius: '5px', transition: '0.3s' }}>
              {isProcessing ? 'FINALISATION...' : `VALIDER LA COMMANDE`}
            </button>
          </form>
        </div>

        {/* Colonne droite : Résumé de la commande */}
        <div style={{ flex: 1, background: '#1A1A1A', padding: '30px', borderRadius: '10px', height: 'fit-content', border: '1px solid #333', minWidth: '300px' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>Résumé de la Commande</h3>
          {cart.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px' }}>
              <img src={item.thumbnail} alt={item.title} style={{width: '50px', height: '50px', borderRadius: '4px', marginRight: '10px'}} />
              <div style={{flex: 1}}>
                <span>{item.title}</span>
                <span style={{color:'#888', display: 'block', fontSize: '0.9em'}}>x{item.quantity}</span>
              </div>
              <span>{formatPrice(item.total, cart.region.currency_code)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#AAA' }}>
              <span>Sous-total</span>
              <span>{formatPrice(cart.subtotal, cart.region.currency_code)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#AAA' }}>
              <span>Livraison</span>
              <span>{formatPrice(cart.shipping_total, cart.region.currency_code)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '20px', color: '#FFD700' }}>
              <span>Total</span>
              <span>{formatPrice(cart.total, cart.region.currency_code)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}