// app/register/page.js
"use client"; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customFetch } from '@/lib/medusa'; 

export default function Register() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("--- Début Inscription Medusa V2 ---");

      // 1. D'ABORD : Créer l'identité dans le module AUTH
      // Endpoint standard V2 pour emailpass
      console.log("1. Création Identité (Auth)...");
      const authResponse = await customFetch("/auth/customer/emailpass/register", "POST", {
        email: formData.email,
        password: formData.password
      });

      // En V2, le token est souvent dans authResponse.token
      const token = authResponse.token;

      if (!token) {
        throw new Error("L'identité a été créée mais aucun token n'a été retourné.");
      }

      console.log("Token reçu, création du profil client...");

      // 2. ENSUITE : Créer le client dans le module STORE
      // On doit passer le token dans le header Authorization
      await customFetch("/store/customers", "POST", {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        // Ne pas renvoyer le password ici
      }, {
        "Authorization": `Bearer ${token}` // C'est CA qui manquait et causait le 401
      });
      
      console.log("Succès ! Redirection...");
      router.push("/login"); 

    } catch (err) {
      console.error("Erreur Inscription:", err);
      // Messages d'erreur plus clairs pour l'utilisateur
      if (err.message.includes("exists")) {
        setError("Un compte existe déjà avec cet email.");
      } else {
        setError(err.message || "Une erreur technique est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
        <div style={{ background: '#1A1A1A', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid #333' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Create Account</h1>
          
          {error && (
            <div style={{ color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input name="first_name" required onChange={handleChange} type="text" placeholder="First Name" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px', width: '100%' }} />
              <input name="last_name" required onChange={handleChange} type="text" placeholder="Last Name" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px', width: '100%' }} />
            </div>

            <input name="email" required onChange={handleChange} type="email" placeholder="Email Address" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
            <input name="password" required onChange={handleChange} type="password" placeholder="Password" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
            
            <button type="submit" disabled={loading} style={{ padding: '15px', background: loading ? '#555' : '#D90429', color: 'white', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
            Already have an account? <Link href="/login" style={{ color: '#D90429', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}