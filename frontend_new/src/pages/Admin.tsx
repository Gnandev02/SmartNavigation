import React, { useState } from 'react';

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (data.success) {
          setIsLoggedIn(true);
          setError('');
        } else {
          setError(data.error || 'Login failed.');
        }
      } catch (err) {
        setError('Network error. Ensure backend is running.');
      }
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  return (
    <>
      <nav className="sticky-nav">
        <div className="container nav-container">
          <div className="logo">SmartNav Admin</div>
          <ul className="nav-links">
            {isLoggedIn && (
              <li><button onClick={handleLogout} className="btn btn-secondary">Logout</button></li>
            )}
          </ul>
        </div>
      </nav>

      {!isLoggedIn ? (
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4" style={{ 
          background: 'radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle animated background glowing orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative w-full max-w-md p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-2xl transition-all hover:border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 mb-2 tracking-tight">Admin Portal</h2>
              <p className="text-gray-400 text-sm font-medium">Manage platform analytics & users.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">Admin Email</label>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  placeholder="admin@smartnav.app" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3.5 mt-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transform transition-all active:scale-[0.98] hover:shadow-emerald-500/50"
              >
                Authenticate
              </button>
            </form>
            
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium flex items-center justify-center gap-2" aria-live="polite">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="container section" id="dashboard-section">
          <h2 className="section-heading" style={{ textAlign: 'left' }}>Platform Analytics</h2>
          <div className="features-grid">
            <div className="dashboard-card">
              <h3 className="card-heading">Total Users</h3>
              <div style={{ fontSize: '48px', color: 'var(--primary-color)', fontWeight: 'bold' }}>12</div>
            </div>
            <div className="dashboard-card">
              <h3 className="card-heading">Active Vision Sessions</h3>
              <div style={{ fontSize: '48px', color: 'var(--secondary-color)', fontWeight: 'bold' }}>3</div>
            </div>
            <div className="dashboard-card">
              <h3 className="card-heading">Recent SOS Alerts</h3>
              <div style={{ fontSize: '48px', color: 'var(--error-color)', fontWeight: 'bold' }}>0</div>
            </div>
          </div>

          <div className="dashboard-card" style={{ marginTop: '32px' }}>
            <h3 className="card-heading">User Management</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>ID</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>Loading data...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      )}
    </>
  );
};

export default Admin;
