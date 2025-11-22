import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

export default function Account() {
  // Fake Order Data
  const orders = [
    { id: '#9821', date: 'Nov 20, 2025', status: 'Shipped', total: '$450' },
    { id: '#9803', date: 'Oct 15, 2025', status: 'Delivered', total: '$120' },
  ];

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      <main style={{ padding: '80px 5%', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem' }}>My Garage</h1>
            <p style={{ color: '#888' }}>Welcome back, Driver.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFD700' }}>Silver Member</div>
            <div style={{ color: '#666' }}>Points: 450</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          
          {/* Left: Saved Car */}
          <div style={{ flex: 1, background: '#1A1A1A', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
            <h3 style={{ marginBottom: '20px', color: '#D90429' }}>Active Vehicle</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
               <div style={{ width: '80px', height: '80px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🚗</div>
               <div>
                 <h2 style={{ margin: 0 }}>2023 Audi RS3</h2>
                 <p style={{ color: '#888', margin: '5px 0 0 0' }}>2.5L TFSI • Quattro</p>
               </div>
            </div>
            <button style={{ marginTop: '20px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Change Vehicle</button>
          </div>

          {/* Right: Order History */}
          <div style={{ flex: 2, background: '#1A1A1A', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
            <h3 style={{ marginBottom: '20px', color: '#D90429' }}>Recent Orders</h3>
            {orders.map(order => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222' }}>
                 <div>
                   <strong style={{ display: 'block' }}>Order {order.id}</strong>
                   <span style={{ fontSize: '0.9rem', color: '#666' }}>{order.date}</span>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: 'bold' }}>{order.total}</div>
                   <span style={{ color: order.status === 'Delivered' ? '#4CAF50' : '#FFD700', fontSize: '0.9rem' }}>{order.status}</span>
                 </div>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}