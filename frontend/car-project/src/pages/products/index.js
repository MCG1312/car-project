import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';

const PLACEHOLDER_IMAGE = "https://placehold.co/400x300/1a1a1a/ffffff?text=No+Image";

export default function ProductsPage({ products, initialSearch }) {
  const router = useRouter();
  const { search } = router.query;
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (search) setFilter('Search Results');
    else setFilter('All');
  }, [search]);

  // ✅ CORRECTION COMPLÈTE : Formater le prix en MAD
  const formatPrice = (product) => {
    const variant = product.variants && product.variants[0];
    
    if (!variant) {
      return "Prix sur demande";
    }

    // ✅ Medusa v2 utilise calculated_price
    if (variant.calculated_price && variant.calculated_price.calculated_amount) {
      const amount = variant.calculated_price.calculated_amount;
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD'
      }).format(amount / 100);
    }

    // Fallback : original_price
    if (variant.original_price) {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD'
      }).format(variant.original_price / 100);
    }

    // Ancien système : prices array
    if (variant.prices && variant.prices.length > 0) {
      let priceObj = variant.prices.find(p => p.currency_code && p.currency_code.toLowerCase() === "mad");
      if (!priceObj) priceObj = variant.prices[0];
      
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: priceObj.currency_code.toUpperCase()
      }).format(priceObj.amount / 100);
    }

    return "Prix sur demande";
  };

  const getImageUrl = (product) => {
    return product.thumbnail || PLACEHOLDER_IMAGE;
  };

  return (
    <div className="app-container" style={{ background: '#050505', minHeight: '100vh' }}>
      <Head><title>Catalog | CarPartsPro</title></Head>

      <main style={{ padding: '100px 5%' }}>
        <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '40px', color: 'white' }}>
          {search ? `Results for "${search}"` : `All Products`} <span style={{ color: '#D90429' }}>PARTS</span>
        </h1>

        {products.length > 0 ? (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            {products.map((product) => (
              <motion.div 
                layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                key={product.id}
                style={{ background: '#1A1A1A', borderRadius: '15px', overflow: 'hidden', border: '1px solid #333' }}
              >
                <div style={{ height: '220px', overflow: 'hidden', background: '#222' }}>
                  <img 
                    src={getImageUrl(product)} 
                    alt={product.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                  />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: 'white', margin: '0 0 10px', fontSize: '1.1rem', height: '50px', overflow: 'hidden' }}>
                    {product.title}
                  </h3>
                  
                  <p style={{color: '#888', fontSize: '0.8rem', marginBottom: '10px'}}>
                    Ref: {product.metadata?.reference_oem || 'N/A'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {formatPrice(product)}
                    </span>
                    <a href={`/products/${product.handle}`} style={{ background: '#333', color: 'white', padding: '5px 15px', borderRadius: '10px', fontSize: '0.9rem', textDecoration: 'none' }}>
                      View
                    </a>
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
    </div>
  );
}

export async function getServerSideProps(context) {
  const { category_id, search } = context.query;
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  try {
    // 1. Récupérer l'ID de la région
    const regionRes = await fetch(`${backendUrl}/store/regions?currency_code=mad`, {
      headers: { "x-publishable-api-key": apiKey }
    });
    const regionData = await regionRes.json();
    const regionId = regionData.regions[0]?.id;
    if (!regionId) throw new Error("Région MAD introuvable");

    // 2. Gérer les sous-catégories
    let allCategoryIds = [];
    if (category_id) {
      allCategoryIds.push(category_id);
      
      try {
        const categoryRes = await fetch(`${backendUrl}/store/product-categories/${category_id}`, {
          headers: { "x-publishable-api-key": apiKey }
        });
        
        if (categoryRes.ok) {
          const categoryData = await categoryRes.json();
          const category = categoryData.product_category;
          
          if (category.category_children && category.category_children.length > 0) {
            category.category_children.forEach(child => {
              allCategoryIds.push(child.id);
            });
          }
        }
      } catch (catError) {
        console.warn("Erreur sous-catégories:", catError);
      }
    }

    // 3. Construire l'URL avec fields pour calculated_price
    let productsUrl = `${backendUrl}/store/products?limit=50&region_id=${regionId}&fields=*variants.calculated_price`;
    
    if (allCategoryIds.length > 0) {
      const categoryParams = allCategoryIds.map(id => `category_id[]=${id}`).join('&');
      productsUrl += `&${categoryParams}`;
    }
    
    if (search) {
      productsUrl += `&q=${encodeURIComponent(search)}`;
    }

    console.log('📡 URL produits:', productsUrl);

    const productsRes = await fetch(productsUrl, {
      headers: { "x-publishable-api-key": apiKey }
    });

    if (!productsRes.ok) {
      const errorData = await productsRes.json();
      console.error("❌ Erreur API:", errorData);
      throw new Error(`API returned status ${productsRes.status}`);
    }

    const productsData = await productsRes.json();
    console.log(`✅ ${productsData.products?.length || 0} produits récupérés`);

    return {
      props: {
        products: productsData.products || [],
      }
    };
  } catch (error) {
    console.error("❌ Erreur getServerSideProps:", error);
    return {
      props: { products: [] }
    };
  }
}