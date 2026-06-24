import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Assistant from './pages/Assistant';
import Caregiver from './pages/Caregiver';
import Admin from './pages/Admin';
import { VoiceProvider } from './context/VoiceContext';

function App() {
  return (
    <VoiceProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/caregiver" element={<Caregiver />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
    </VoiceProvider>
  );
}

export default App;
