// app/login/page.js (ou pages/login.js selon ta structure)
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// On importe ta fonction customFetch
import { customFetch } from '@/lib/medusa'; 

// Note: J'ai retiré les imports Header/Footer s'ils sont déjà dans ton layout.js global.
// Sinon, tu peux les remettre.

export default function Login() {
  const router = useRouter();
  
  // États
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gestion des inputs
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await customFetch("/store/login", "POST", credentials);
      
      if (response.token) {
        localStorage.setItem('jwt_token', response.token);
        console.log("Token JWT stocké ! Redirection...");
        
        // --- LA CORRECTION EST ICI ---
        // On remplace router.push('/') par ceci pour forcer un rechargement complet
        window.location.href = "/";
        // -----------------------------
      } else {
        throw new Error("Aucun token reçu du serveur.");
      }

    } catch (err) {
      setError(err.message || "Email ou mot de passe incorrect.");
      setLoading(false); // Assure-toi que loading passe à false en cas d'erreur
    }
  };
  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
        <div style={{ background: '#1A1A1A', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid #333' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Welcome Back</h1>
          
          {/* Affichage des erreurs */}
          {error && (
            <div style={{ color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#BBB' }}>Email Address</label>
              <input 
                name="email"
                type="email" 
                required
                onChange={handleChange}
                style={{ width: '100%', padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#BBB' }}>Password</label>
              <input 
                name="password"
                type="password" 
                required
                onChange={handleChange}
                placeholder="Password"
                style={{ width: '100%', padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '15px', 
                background: loading ? '#555' : '#D90429', 
                color: 'white', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                borderRadius: '4px',
                transition: 'background 0.3s'
              }}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
            New here? <Link href="/register" style={{ color: '#D90429', fontWeight: 'bold', textDecoration: 'none' }}>Create Account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}