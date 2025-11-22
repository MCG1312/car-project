import '../styles/globals.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { CartProvider } from '../context/CartContext';
// Import Notification
import Notification from '../components/Notification'; 

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    <CartProvider>
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
      {/* Add Notification Here */}
      <Notification />
    </CartProvider>
  );
}

export default MyApp;