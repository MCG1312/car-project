import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

export default function Contact() {
  return (
    <div style={{ background: '#000', color: 'white', minHeight: '100vh' }}>
      <Header />
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
        <motion.div 
          initial={{ rotateY: 90, opacity: 0 }} 
          animate={{ rotateY: 0, opacity: 1 }} 
          transition={{ duration: 0.8 }}
          style={{ width: '100%', maxWidth: '600px', background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #D90429' }}
        >
          <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>GET IN TOUCH</h1>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder="Name" style={{ padding: '15px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
            <input type="email" placeholder="Email" style={{ padding: '15px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
            <textarea rows="5" placeholder="Message" style={{ padding: '15px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '8px' }}></textarea>
            <button style={{ padding: '15px', background: '#D90429', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>SEND MESSAGE</button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}