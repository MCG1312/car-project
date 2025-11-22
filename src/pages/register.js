import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function Register() {
  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
        <div style={{ background: '#1A1A1A', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid #333' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Create Account</h1>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder="Full Name" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
            <input type="email" placeholder="Email Address" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
            <input type="password" placeholder="Password" style={{ padding: '12px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
            <button style={{ padding: '15px', background: '#D90429', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
              REGISTER
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
            Already have an account? <Link href="/login" style={{ color: '#D90429', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}