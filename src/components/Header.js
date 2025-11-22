import Link from 'next/link';
import { useCart } from '../context/CartContext';
import styles from './Header.module.css';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false); // State for mobile menu
  const { cartCount } = useCart(); 
  const router = useRouter();

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        router.push(`/products?search=${searchTerm}`);
        setIsMobileOpen(false); // Close menu on search
      }
    }
  };

  return (
    <header style={{ position: 'relative', zIndex: 1000 }}>
      {/* 1. TOP BAR */}
      <div className={styles.topBar}>
        <span>🚗 Fast Shipping on orders over $150</span>
        <span>Call us: <span className={styles.goldAccent}>+1 800 CAR-PROS</span></span>
      </div>

      {/* 2. MAIN BAR */}
      <div className={styles.mainBar}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          CarParts<span>Pro</span>
        </Link>

        {/* Hamburger Button (Visible only on mobile) */}
        <button 
          className={styles.hamburger} 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>

        {/* Search Bar */}
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

        {/* Icons */}
        <div className={styles.actions}>
          <Link href="/login" className={styles.iconLink}>
            <span className={styles.iconSize}>👤</span>
            <span>Sign In</span>
          </Link>
          
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
          <li><Link href="/products?category=Moteur" className={styles.navLink}>MOTEUR</Link></li>
          <li><Link href="/products?category=Freinage" className={styles.navLink}>FREINAGE</Link></li>
          <li><Link href="/products?category=Suspension" className={styles.navLink}>SUSPENSION</Link></li>
          <li><Link href="/products?category=Échappement" className={styles.navLink}>ÉCHAPPEMENT</Link></li>
          <li><Link href="/products?category=Électricité" className={styles.navLink}>ÉLECTRICITÉ</Link></li>
          <li><Link href="/products?category=Carrosserie" className={styles.navLink}>CARROSSERIE</Link></li>
          <li><Link href="/about" className={styles.navLink} style={{ background: '#B00321' }}>ABOUT US</Link></li>
        </ul>
      </nav>

      {/* 4. MOBILE MENU (Appears when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/" onClick={() => setIsMobileOpen(false)}>HOME</Link>
          <Link href="/products?category=Moteur" onClick={() => setIsMobileOpen(false)}>MOTEUR</Link>
          <Link href="/products?category=Freinage" onClick={() => setIsMobileOpen(false)}>FREINAGE</Link>
          <Link href="/products?category=Suspension" onClick={() => setIsMobileOpen(false)}>SUSPENSION</Link>
          <Link href="/products?category=Échappement" onClick={() => setIsMobileOpen(false)}>ÉCHAPPEMENT</Link>
          <Link href="/products?category=Électricité" onClick={() => setIsMobileOpen(false)}>ÉLECTRICITÉ</Link>
          <Link href="/products?category=Carrosserie" onClick={() => setIsMobileOpen(false)}>CARROSSERIE</Link>
          <Link href="/about" onClick={() => setIsMobileOpen(false)} style={{ color: '#D90429' }}>ABOUT US</Link>
        </div>
      )}
    </header>
  );
}