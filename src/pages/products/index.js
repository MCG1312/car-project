import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { products, categories } from '../../data/products';

export default function ProductsPage() {
  const router = useRouter();
  const { category, search } = router.query; // ✅ Get search param
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (category) setFilter(category);
    else if (search) setFilter('Search Results'); // ✅ Handle Search Title
    else setFilter('All');
  }, [category, search]);

  // ✅ ADVANCED FILTER LOGIC
  const filteredProducts = products.filter(p => {
    if (search) {
      // Search in Name or Description (Case insensitive)
      return p.name.toLowerCase().includes(search.toLowerCase()) || 
             p.description.toLowerCase().includes(search.toLowerCase());
    }
    if (filter === 'All' || filter === 'Search Results') return true;
    return p.category === filter;
  });

  return (
    <div className="app-container" style={{ background: '#050505', minHeight: '100vh' }}>
      <Head><title>Catalog | CarPartsPro</title></Head>
      <Header />
      
      <main style={{ padding: '100px 5%' }}>
        <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '40px', color: 'white' }}>
          {search ? `Results for "${search}"` : `${filter}`} <span style={{ color: '#D90429' }}>PARTS</span>
        </h1>

        {/* Category Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '50px' }}>
          {['All', ...categories.map(c => c.name)].map((cat) => (
            <button 
              key={cat}
              onClick={() => {
                setFilter(cat);
                router.push(`/products?category=${cat}`, undefined, { shallow: true });
              }}
              style={{ 
                padding: '10px 25px', 
                borderRadius: '30px', 
                border: filter === cat ? '2px solid #D90429' : '1px solid #333',
                background: filter === cat ? '#D90429' : '#111',
                color: 'white', cursor: 'pointer', fontWeight: 'bold',
                transition: '0.3s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            {filteredProducts.map((product) => (
              <motion.div 
                layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                key={product.id}
                style={{ background: '#1A1A1A', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333' }}
              >
                <div style={{ height: '220px', overflow: 'hidden', background: '#222' }}>
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: 'white', margin: '0 0 10px' }}>{product.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>${product.price}</span>
                    <Link href={`/products/${product.id}`} style={{ background: '#333', color: 'white', padding: '5px 15px', borderRadius: '10px', fontSize: '0.9rem', textDecoration: 'none' }}>
                      View
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', color: '#888', fontSize: '1.5rem', marginTop: '50px' }}>
            No products found. Try a different search.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}