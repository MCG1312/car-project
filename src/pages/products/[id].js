import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { products } from '../../data/products';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext'; // Checks src/context/CartContext.js

export default function ProductDetail({ product }) {
  const { addToCart } = useCart();

  if (!product) return <div style={{color: 'white', padding: '50px'}}>Loading...</div>;

  return (
    <div className="app-container">
      <Header />
      <main style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', background: '#050505', minHeight: '80vh' }}>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', gap: '50px', maxWidth: '1000px', flexWrap: 'wrap', width: '100%' }}
        >
          {/* Image Area */}
          <div style={{ flex: 1, minWidth: '300px', height: '400px', background: '#222', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
             <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Info Area */}
          <div style={{ flex: 1, minWidth: '300px', color: 'white' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '10px', lineHeight: '1.1' }}>{product.name}</h1>
            <div style={{ fontSize: '1.5rem', color: '#FFD700', marginBottom: '20px', fontWeight: 'bold' }}>${product.price}</div>
            
            <p style={{ lineHeight: '1.6', marginBottom: '20px', color: '#CCC', fontSize: '1.1rem' }}>
              {product.description}
            </p>
            
            <div style={{ background: '#1A1A1A', padding: '20px', borderLeft: '4px solid #D90429', marginBottom: '30px', borderRadius: '0 10px 10px 0' }}>
              <strong style={{ color: '#FFF', display: 'block', marginBottom: '5px' }}>Technical Specs:</strong> 
              <span style={{ color: '#AAA' }}>{product.specs}</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: '#B00321' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(product)} 
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
              Add to Cart
            </motion.button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

export async function getStaticPaths() {
  const paths = products.map((product) => ({
    params: { id: product.id },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const product = products.find((p) => p.id === params.id);
  return { props: { product } };
}