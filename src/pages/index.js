import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { categories, products } from '../data/products';

// --- 1. VEHICLE SELECTOR COMPONENT ---
const VehicleSelector = () => (
  <motion.div 
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.6 }}
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.2)',
      marginTop: '40px',
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: '900px',
      width: '100%'
    }}
  >
    <select style={{ padding: '12px', borderRadius: '5px', border: 'none', flex: 1, minWidth: '120px' }}>
      <option>Select Year</option>
      <option>2024</option>
      <option>2023</option>
      <option>2022</option>
    </select>
    <select style={{ padding: '12px', borderRadius: '5px', border: 'none', flex: 1, minWidth: '120px' }}>
      <option>Select Make</option>
      <option>Audi</option>
      <option>BMW</option>
      <option>Mercedes</option>
      <option>Toyota</option>
    </select>
    <select style={{ padding: '12px', borderRadius: '5px', border: 'none', flex: 1, minWidth: '120px' }}>
      <option>Select Model</option>
      <option>RS3</option>
      <option>M4 Competition</option>
      <option>Supra MK5</option>
    </select>
    <button style={{ 
      padding: '12px 30px', 
      background: '#D90429', 
      color: 'white', 
      border: 'none', 
      fontWeight: 'bold', 
      borderRadius: '5px', 
      cursor: 'pointer',
      textTransform: 'uppercase'
    }}>
      Check Fitment
    </button>
  </motion.div>
);

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', overflowX: 'hidden' }}>
      <Head>
        <title>CarPartsPro | Premium Auto Parts</title>
      </Head>

      <Header />

      {/* === HERO SECTION WITH SELECTOR === */}
      <section style={{ 
        height: '90vh', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0 20px'
      }}>
        <motion.div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '120%', 
          backgroundImage: 'url("/images/hero-bg.jpg")', 
          backgroundSize: 'cover', backgroundPosition: 'center',
          y: yHero, zIndex: 0, filter: 'brightness(0.4)'
        }} />

        <div style={{ zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8 }}
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.1' }}
          >
            Find The Perfect <span style={{ color: '#D90429' }}>Fit</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: '1.3rem', color: '#CCC', margin: '20px 0 10px' }}
          >
            Select your vehicle to see compatible performance parts.
          </motion.p>

          {/* THE NEW VEHICLE SELECTOR */}
          <VehicleSelector />
        </div>
      </section>

      {/* === CATEGORIES === */}
      <section id="categories" style={{ padding: '80px 5%' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '50px' }}>SHOP BY <span style={{ color: '#D90429' }}>CATEGORY</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {categories.map((cat) => (
            <Link href={`/products?category=${cat.name}`} key={cat.name} style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ y: -5 }} style={{ background: '#1A1A1A', padding: '20px', borderRadius: '10px', border: '1px solid #333', textAlign: 'center' }}>
                <div style={{ height: '120px', overflow: 'hidden', marginBottom: '15px', borderRadius: '5px' }}>
                    <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.1rem' }}>{cat.name}</h3>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* === HOT CONTENT: BEST SELLERS === */}
      {/* === HOT CONTENT: BEST SELLERS === */}
      <section style={{ padding: '80px 5%', background: '#111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>BEST <span style={{ color: '#D90429' }}>SELLERS</span></h2>
            <Link href="/products" style={{ color: '#FFD700', textDecoration: 'none', fontWeight: 'bold' }}>View All Products →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            {products.slice(0, 4).map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} style={{ textDecoration: 'none' }}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  style={{ background: '#050505', border: '1px solid #222', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div style={{ height: '200px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#D90429', padding: '5px 10px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '3px', color: 'white', zIndex: 10 }}>HOT</div>
                    <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: 'white' }}>{product.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <p style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>${product.price}</p>
                       <span style={{ color: '#AAA', fontSize: '0.9rem' }}>View Part →</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === CUSTOMER REVIEWS === */}
      <section style={{ padding: '80px 5%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '50px' }}>TRUSTED BY <span style={{ color: '#D90429' }}>PROS</span></h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
            {[
                { name: "Alex D.", role: "Track Racer", text: "The ceramic brakes completely changed my lap times. Fast shipping and solid advice." },
                { name: "Sarah M.", role: "Mechanic", text: "Finally a parts supplier that understands fitment. The vehicle tool is spot on." },
                { name: "Mike T.", role: "Tuner", text: "High quality parts. The turbo kit arrived in perfect condition. Will buy again." }
            ].map((review, i) => (
                <div key={i} style={{ background: '#1A1A1A', padding: '30px', borderRadius: '10px', maxWidth: '350px', border: '1px solid #333', textAlign: 'left' }}>
                    <div style={{ color: '#FFD700', marginBottom: '15px' }}>★★★★★</div>
                    <p style={{ fontStyle: 'italic', marginBottom: '20px', color: '#CCC' }}>"{review.text}"</p>
                    <div style={{ fontWeight: 'bold' }}>{review.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>{review.role}</div>
                </div>
            ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}