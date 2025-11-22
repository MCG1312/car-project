import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router'; // <--- Added this
import { motion } from 'framer-motion';

export default function CartPage() {
  const { cart, removeFromCart, cartTotal } = useCart();
  const router = useRouter(); // <--- Added this

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      
      <main style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '40px' }}>YOUR <span style={{ color: '#D90429' }}>CART</span></h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <h2 style={{ color: '#888' }}>Your cart is empty.</h2>
            <Link href="/products" style={{ display: 'inline-block', marginTop: '20px', color: '#FFD700', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.2rem' }}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cart.map((item) => (
              <motion.div 
                layout key={item.id} 
                style={{ display: 'flex', alignItems: 'center', background: '#1A1A1A', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}
              >
                <div style={{ width: '100px', height: '100px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginRight: '20px' }}>
                  <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '5px' }}>{item.name}</h3>
                  <p style={{ color: '#888' }}>Unit Price: ${item.price}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '10px' }}>x{item.quantity}</div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: '1px solid #555', color: '#AAA', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Remove</button>
                </div>
              </motion.div>
            ))}

            <div style={{ marginTop: '40px', textAlign: 'right', borderTop: '1px solid #333', paddingTop: '30px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Total: <span style={{ color: '#FFD700' }}>${cartTotal}</span></h2>
              
              {/* 👇 BUTTON NOW GOES TO CHECKOUT */}
              <button 
                onClick={() => router.push('/checkout')}
                style={{ 
                  background: '#D90429', color: 'white', border: 'none', 
                  padding: '15px 50px', fontSize: '1.2rem', fontWeight: 'bold', 
                  borderRadius: '50px', cursor: 'pointer' 
                }}
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}