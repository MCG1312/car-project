import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';
import { useState } from 'react';
// Importe ton client Medusa, nous en aurons besoin
import { medusaClient } from '@/lib/medusa'; // Adapte le chemin

export default function Checkout() {
  // 1. On récupère l'objet cart complet, plus besoin de cartTotal séparé
  const { cart, loading } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fonction pour formater les prix
  const formatPrice = (amount) => {
    if (!cart) return "0.00 MAD"; // S'assurer que le panier existe
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: cart.region.currency_code.toUpperCase()
    }).format(amount / 100);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // --- LOGIQUE DE CHECKOUT MEDUSA (à venir) ---
    // Pour l'instant, on simule toujours le succès
    // 1. Mettre à jour les infos client dans le panier
    // 2. Créer une session de paiement
    // 3. Compléter la commande
    
    console.log("Simulation de paiement...");
    setTimeout(() => {
      // On ne vide plus le contexte, on supprime le cart_id
      localStorage.removeItem('cart_id'); 
      router.push('/success');
    }, 2000);
  };

  // 2. GESTION DU CHARGEMENT ET PANIER VIDE
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Chargement...</div>;
  }

  // La vérification doit se faire sur cart.items
  if (!cart || !cart.items || cart.items.length === 0) {
    if (typeof window !== 'undefined') router.push('/cart');
    return null;
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <main style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '50px', flexWrap: 'wrap-reverse' }}>
        {/* LEFT: SHIPPING FORM */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>CHECKOUT</h1>
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <h3 style={{ color: '#D90429', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Shipping Information</h3>
            
            {/* Name Fields */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <input required type="text" placeholder="First Name" style={inputStyle} />
              <input required type="text" placeholder="Last Name" style={inputStyle} />
            </div>

            {/* Email Field (Validation: Must contain @) */}
            <input required type="email" placeholder="Email Address" style={inputStyle} />
            
            {/* Address Field */}
            <input required type="text" placeholder="Address" style={inputStyle} />
            
            {/* City & Zip (Validation: Zip must be numbers) */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <input required type="text" placeholder="City" style={inputStyle} />
              <input 
                required 
                type="text" 
                pattern="[0-9]*" 
                title="Please enter a valid numeric ZIP code"
                placeholder="ZIP Code" 
                style={inputStyle} 
              />
            </div>

            <h3 style={{ color: '#D90429', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '20px' }}>Payment Details</h3>
            
            {/* Credit Card (Validation: Numbers only, Max 19 chars) */}
            <input 
              required 
              type="text" 
              inputMode="numeric"
              pattern="[0-9\s]{13,19}" 
              maxLength="19"
              title="Card number must be between 13 and 19 digits"
              placeholder="Card Number (0000 0000 0000 0000)" 
              style={inputStyle} 
            />

            {/* Expiry & CVC (Validation: Exact lengths) */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <input 
                required 
                type="text" 
                maxLength="4"
                placeholder="MM/YY" 
                style={inputStyle} 
              />
              <input 
                required 
                type="text" 
                maxLength="3"
                pattern="[0-9]{3,4}"
                placeholder="CVC" 
                style={inputStyle} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              style={{ 
                marginTop: '30px', 
                padding: '15px', 
                background: isProcessing ? '#555' : '#D90429', 
                color: 'white', 
                border: 'none', 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                cursor: isProcessing ? 'wait' : 'pointer', 
                borderRadius: '5px',
                transition: '0.3s'
              }}
            >
              {isProcessing ? 'PROCESSING...' : `PAY $${cartTotal}`}
            </button>
          </form>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div style={{ flex: 1, background: '#1A1A1A', padding: '30px', borderRadius: '10px', height: 'fit-content', border: '1px solid #333' }}>
          <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
              <span>{item.name} <span style={{color:'#888'}}>x{item.quantity}</span></span>
              <span>${item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '20px', color: '#FFD700' }}>
            <span>Total</span>
            <span>${cartTotal}</span>
          </div>
        </div>

      </main>
    </div>
  );
}

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