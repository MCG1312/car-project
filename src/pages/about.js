import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div style={{ background: '#000', color: 'white', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 20px' }}>
        <motion.h1 
          initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          style={{ fontSize: '4rem', marginBottom: '40px', color: '#D90429' }}
        >
          OUR LEGACY.
        </motion.h1>
        <motion.p 
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '20px', color: '#CCC' }}
        >
          CarPartsPro was founded with a simple mission: To make professional-grade performance parts accessible to every enthusiast.
        </motion.p>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ width: '100%', height: '300px', background: '#222', borderRadius: '20px', margin: '40px 0' }} 
        >
            {/* Put an image here if you want */}
        </motion.div>
        <p>We test every part on the track, not just in a simulator. If it doesn't make you faster, we don't sell it.</p>
      </main>
      <Footer />
    </div>
  );
}