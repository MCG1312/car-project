import Head from 'next/head';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import VehicleSearch from '../components/VehicleSearch';
import { formatPrice, getProductImage } from "@/lib/helpers";
// La page reçoit maintenant ses données via les props (brands, categories, bestSellers)
export default function HomePage({ brands, categories, bestSellers }) {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', overflowX: 'hidden' }}>
      <Head>
        <title>CarPartsPro | Pièces Auto Premium au Maroc</title>
      </Head>

      {/* === HERO SECTION AVEC LE SÉLECTEUR DE VÉHICULE === */}
      <section style={{ height: '90vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <motion.div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '120%', backgroundImage: 'url("/images/hero-bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', y: yHero, zIndex: 0, filter: 'brightness(0.4)' }} />
        <div style={{ zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.1' }}>
            Trouvez la pièce <span style={{ color: '#D90429' }}>parfaite</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ fontSize: '1.3rem', color: '#CCC', margin: '20px 0 10px' }}>
            Sélectionnez votre véhicule pour voir les pièces compatibles.
          </motion.p>
          {/* On passe la liste des marques au composant de recherche */}
          <VehicleSearch brands={brands} />
        </div>
      </section>

      {/* === CATÉGORIES (Maintenant dynamiques) === */}
      <section id="categories" style={{ padding: '80px 5%' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '50px' }}>ACHETER PAR <span style={{ color: '#D90429' }}>CATÉGORIE</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {categories.map((cat) => (
            <Link href={`/products?category_id=${cat.id}`} key={cat.id} style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ y: -5 }} style={{ background: '#1A1A1A', padding: '20px', borderRadius: '10px', border: '1px solid #333', textAlign: 'center' }}>
                <div style={{ height: '120px', overflow: 'hidden', marginBottom: '15px', borderRadius: '5px' }}>
                    {/* Note: Il faudra ajouter des images aux catégories dans l'Admin Medusa pour qu'elles s'affichent */}
                    <img src={cat.metadata?.image_url || "https://placehold.co/400x300/1a1a1a/FFF?text=Image"} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.1rem' }}>{cat.name}</h3>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* === MEILLEURES VENTES (Maintenant dynamiques) === */}
      <section style={{ padding: '80px 5%', background: '#111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>MEILLEURES <span style={{ color: '#D90429' }}>VENTES</span></h2>
            <Link href="/products" style={{ color: '#FFD700', textDecoration: 'none', fontWeight: 'bold' }}>Voir toutes les pièces →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            {bestSellers.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -10 }} style={{ background: '#050505', border: '1px solid #222', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: '200px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#D90429', padding: '5px 10px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '3px', color: 'white', zIndex: 10 }}>HOT</div>
                    <img src={getProductImage(product)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: 'white' }}>{product.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <p style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>{formatPrice(product)}</p>
                       <span style={{ color: '#AAA', fontSize: '0.9rem' }}>Voir la pièce →</span>
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

    </div>
  );
}
export async function getServerSideProps() {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const headers = { "x-publishable-api-key": apiKey };

  try {
    // 1. Charger les marques pour VehicleSearch
    const brandsRes = await fetch(`${backendUrl}/store/vehicle-options?type=brand`, { headers });
    const brandsData = await brandsRes.json();

    // 2. Charger les catégories parentes pour la section "Shop by Category"
    const categoriesRes = await fetch(`${backendUrl}/store/product-categories?parent_category_id=null`, { headers });
    const categoriesData = await categoriesRes.json();
    
    // 3. Charger les 4 premiers produits pour la section "Best Sellers"
    const BEST_SELLER_COLLECTION_ID = "pcol_01KDBJYZFC91PP2KY7KJBPJ30K"; // <-- Met l'ID de ta collection ici

    const productsRes = await fetch(`${backendUrl}/store/products?collection_id[]=${BEST_SELLER_COLLECTION_ID}&limit=4&fields=*variants.prices`, { headers });
    const productsData = await productsRes.json();
    console.log("🕵️‍♂️ Données reçues du Backend (côté serveur) :");
    console.log(JSON.stringify(brandsData, null, 2));
    return {
      props: {
        brands: brandsData.options || [],
        categories: categoriesData.product_categories || [],
        bestSellers: productsData.products || [],
      }
    };
    
  } catch (error) {
    console.error("Erreur chargement données HomePage:", error);
    return {
      props: { brands: [], categories: [], bestSellers: [] }
    };
  }
}