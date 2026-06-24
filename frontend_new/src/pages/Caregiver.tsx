import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const Caregiver: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setSocket] = useState<Socket | null>(null);
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setWsStatus('Connected');
      });

      newSocket.on('disconnect', () => {
        setWsStatus('Disconnected');
      });

      newSocket.on('sos_triggered', (alertData) => {
        setAlerts(prev => [alertData, ...prev]);
      });

      newSocket.on('location_update', (locData) => {
        setLocation({ lat: locData.latitude, lng: locData.longitude });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isLoggedIn]);

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
      setError('Please enter valid credentials.');
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
          <div className="logo">🧭 SmartNav Caregiver</div>
          <ul className="nav-links">
            {isLoggedIn ? (
              <>
                <li>
                  <span id="ws-badge" className={`ws-status ${wsStatus === 'Connected' ? 'ws-connected' : 'ws-disconnected'}`} 
                        style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, 
                                 background: wsStatus === 'Connected' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                                 color: wsStatus === 'Connected' ? 'var(--success-color)' : 'var(--error-color)' }}>
                    {wsStatus}
                  </span>
                </li>
                <li><button onClick={handleLogout} className="btn btn-secondary">Logout</button></li>
              </>
            ) : (
              <li><button className="btn btn-secondary" disabled>Login</button></li>
            )}
          </ul>
        </div>
      </nav>

      {!isLoggedIn ? (
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4" style={{ 
          background: 'radial-gradient(circle at 50% -20%, #1a1a2e 0%, #0f0f1a 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle animated background glowing orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative w-full max-w-md p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-2xl transition-all hover:border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 tracking-tight">Caregiver Portal</h2>
              <p className="text-gray-400 text-sm font-medium">Monitor your loved ones in real-time.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] hover:shadow-blue-500/50"
              >
                Sign In Securely
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
          <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            {/* Left Column: SOS & Contacts */}
            <div>
              <div className="dashboard-card">
                <h3 className="card-heading" style={{ color: 'var(--error-color)' }}>🚨 Active Alerts</h3>
                <div id="sos-list" aria-live="assertive">
                  {alerts.length === 0 ? (
                    <p className="text-small">No active alerts.</p>
                  ) : (
                    alerts.map((alert, idx) => (
                      <div key={idx} className="alert-item" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error-color)', borderRadius: '8px', marginBottom: '12px' }}>
                        <p><strong>SOS Triggered</strong></p>
                        <p className="text-small">Lat: {alert.latitude}, Lng: {alert.longitude}</p>
                        <p className="text-small">{new Date(alert.triggeredAt || Date.now()).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="dashboard-card">
                <h3 className="card-heading">Emergency Contacts</h3>
                <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>Primary: 911</li>
                  <li style={{ padding: '8px 0' }}>Secondary: +1 555-0198</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Location & Activity */}
            <div>
              <div className="dashboard-card">
                <h3 className="card-heading">Real-Time Location tracking</h3>
                <div style={{ background: 'var(--bg-color)', height: '200px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                  {location ? (
                    <p>Map showing: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                  ) : (
                    <p className="text-small">Map integration placeholder</p>
                  )}
                </div>
                <p className="text-small" id="last-location">
                  {location ? `Last seen at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Waiting for location update...'}
                </p>
              </div>

              <div className="dashboard-card">
                <h3 className="card-heading">Activity Timeline</h3>
                <div id="activity-list" aria-live="polite">
                  <p className="text-small">Connecting to stream...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  );
};

export default Caregiver;
