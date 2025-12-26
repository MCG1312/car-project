import Link from 'next/link';
import { useCart } from '../context/CartContext';
import styles from './Header.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// Importe ton client API (assure-toi que le chemin est bon)
import { customFetch } from '@/lib/medusa'; 

export default function Header({ categories = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // NOUVEAU : État pour stocker l'utilisateur
  const [customer, setCustomer] = useState(null);
  
  const { cartCount } = useCart(); 
  const router = useRouter();

  // 1. Au chargement, on vérifie si l'utilisateur est connecté via le Proxy
  useEffect(() => {
    async function checkSession() {
      try {
        // On appelle notre nouvelle route JWT-protégée
        const data = await customFetch("/store/me"); 
        if (data.customer) {
          setCustomer(data.customer);
        }
      } catch (e) {
        setCustomer(null);
      }
    }
    checkSession();
  }, []);

// 2. La fonction de déconnexion
  const handleLogout = () => {
    // Pas besoin d'appel API, on supprime juste le token localement
    localStorage.removeItem('jwt_token');
    setCustomer(null);
    router.push('/login');
    router.reload();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        router.push(`/products?search=${searchTerm}`);
        setIsMobileOpen(false);
      }
    }
  };

  return (
    <header style={{ position: 'relative', zIndex: 1000 }}>
      {/* 1. TOP BAR */}
      <div className={styles.topBar}>
        <a href="tel:+212688592364" className={styles.phoneLink}>
          Appelez Nous: <span className={styles.goldAccent}>+2126 88 59 23 64</span>
        </a>
      </div>
      {/* 2. MAIN BAR */}
      <div className={styles.mainBar}>
        <Link href="/" className={styles.logo}>
          PokeAuto<span>Parts</span>
        </Link>
        <button 
          className={styles.hamburger} 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search parts..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button className={styles.searchButton} onClick={handleSearch}>🔍</button>
        </div>
        
        <div className={styles.actions}>
          
          {/* --- MODIFICATION ICI : CONDITION LOGIN / USER --- */}
          {customer ? (
            // CAS CONNECTÉ : On affiche le prénom et Logout
            <div className={styles.iconLink} style={{ cursor: 'default' }}>
              <span className={styles.iconSize} style={{ color: '#4CAF50' }}>👤</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{customer.first_name}</span>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#888', 
                    fontSize: '11px', 
                    cursor: 'pointer', 
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            // CAS NON CONNECTÉ : Lien classique vers Login
            <Link href="/login" className={styles.iconLink}>
              <span className={styles.iconSize}>👤</span>
              <span>Sign In</span>
            </Link>
          )}
          {/* ----------------------------------------------- */}

          <Link href="/cart" className={styles.iconLink}>
            <span className={styles.iconSize} style={{color: '#FFD700'}}>🛒</span>
            <span>Cart ({cartCount})</span>
          </Link>
        </div>
      </div>

      {/* 3. DESKTOP NAV */}
      <nav className={styles.navBar}>
        <ul className={styles.navList}>
          <li><Link href="/" className={styles.navLink}>HOME</Link></li>
          
          {categories
            .filter(category => !category.parent_category_id)
            .map((category) => (
              <li key={category.id}>
                <Link href={`/products?category_id=${category.id}`} className={styles.navLink}>
                  {category.name.toUpperCase()}
                </Link>
              </li>
          ))}
          
          <li><Link href="/about" className={styles.navLink} style={{ background: '#B00321' }}>ABOUT US</Link></li>
        </ul>
      </nav>

      {/* 4. MOBILE MENU */}
      {isMobileOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/" onClick={() => setIsMobileOpen(false)}>HOME</Link>
           {categories
            .filter(category => !category.parent_category_id)
            .map((category) => (
             <Link 
              key={category.id}
              href={`/products?category_id=${category.id}`} 
              onClick={() => setIsMobileOpen(false)}
             >
              {category.name.toUpperCase()}
            </Link>
          ))}
          
          {/* Ajout du lien Mon compte / Logout aussi en mobile si tu veux */}
          {customer ? (
             <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'white', textAlign: 'left', fontSize: '18px', padding: '10px 0' }}>
               LOGOUT ({customer.first_name})
             </button>
          ) : (
             <Link href="/login" onClick={() => setIsMobileOpen(false)}>SIGN IN</Link>
          )}

          <Link href="/about" onClick={() => setIsMobileOpen(false)} style={{ color: '#D90429' }}>ABOUT US</Link>
        </div>
      )}
    </header>
  );
}