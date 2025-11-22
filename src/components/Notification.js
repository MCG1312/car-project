import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function Notification() {
  const { notification } = useCart();

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: '#1A1A1A',
            borderLeft: '5px solid #D90429',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          {notification}
        </motion.div>
      )}
    </AnimatePresence>
  );
}