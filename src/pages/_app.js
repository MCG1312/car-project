import '../styles/globals.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { CartProvider } from '../context/CartContext';
import Notification from '../components/Notification';
import Header from '../components/Header'; // Assure-toi que le chemin est bon
import Footer from '../components/Footer'; // Assure-toi que le chemin est bon

function MyApp({ Component, pageProps, categories }) {
  const router = useRouter();

  return (
    <CartProvider>
      {/* On passe les catégories chargées en prop au Header */}
      <Header categories={categories} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={router.route}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
      
      <Footer />
      <Notification />
    </CartProvider>
  );
}

// --- C'EST LA PARTIE QUI CHARGE LES DONNÉES ---
MyApp.getInitialProps = async (context) => {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  try {
    // On appelle l'API des catégories
    // On ne prend que les catégories parentes (celles qui n'ont pas de parent)
    const res = await fetch(`${backendUrl}/store/product-categories?limit=200`, {
      headers: { "x-publishable-api-key": apiKey }
    });
    
    if (!res.ok) {
      console.error("Impossible de charger les catégories");
      return { categories: [] };
    }

    const data = await res.json();
    
    // On renvoie les catégories pour qu'elles soient disponibles dans MyApp
    return {
      categories: data.product_categories || []
    };

  } catch (error) {
    console.error("Erreur getInitialProps:", error);
    return { categories: [] };
  }
};

export default MyApp;