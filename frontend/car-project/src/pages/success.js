// pages/success.js
import Link from 'next/link';
import { motion } from 'framer-motion';
// 1. IMPORTE LES HOOKS
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const router = useRouter();
  // 2. ÉTAT POUR STOCKER L'ID DE LA COMMANDE
  const [displayId, setDisplayId] = useState('');

  // 3. ON RÉCUPÈRE L'ID DE L'URL QUAND LA PAGE SE CHARGE
  useEffect(() => {
    // router.query contient les paramètres de l'URL, ex: { order_id: 'order_...' }
    if (router.query.order_id) {
      // Medusa renvoie "order_..." mais pour le client, on peut afficher quelque chose de plus simple
      // On prend juste la fin de l'ID pour l'affichage
      const fullId = router.query.order_id;
      setDisplayId(fullId.split('_').pop().toUpperCase());
    }
  }, [router.query]); // L'effet se relance si les paramètres de l'URL changent

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '20px' }}>
        
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          style={{ fontSize: '5rem', marginBottom: '20px' }}
        >
          ✅
        </motion.div>
        
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Order Confirmed!</h1>
        <p style={{ fontSize: '1.2rem', color: '#CCC', maxWidth: '600px', marginBottom: '20px' }}>
          Thank you for choosing PokeAutoParts. Your high-performance parts are being prepared for shipment. You will receive an email shortly.
        </p>
        
        {/* 4. ON AFFICHE L'ID DE COMMANDE SI ON L'A */}
        {displayId && (
          <div style={{ background: '#1A1A1A', padding: '15px 30px', borderRadius: '10px', marginBottom: '40px', border: '1px solid #333' }}>
            <span style={{ color: '#AAA' }}>Your Order ID:</span>
            <strong style={{ color: '#FFD700', marginLeft: '10px', fontSize: '1.2rem' }}>#{displayId}</strong>
          </div>
        )}

        <Link href="/" style={{ padding: '15px 40px', background: '#D90429', color: 'white', textDecoration: 'none', fontWeight: 'bold', borderRadius: '30px' }}>
          BACK TO HOME
        </Link>

      </main>
    </div>
  );
}