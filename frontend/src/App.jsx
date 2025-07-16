import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import FortuneRoulette from './pages/FortuneRoulette';
import CoinFlip from './pages/CoinFlip';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MessageProvider } from './contexts/MessageContext';

function App() {
  return (
    <MessageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
            <Route path="/fortune-roulette" element={<FortuneRoulette />} />
            <Route path="/coin-flip" element={<CoinFlip />} />
        </Routes>
      </Router>
    </MessageProvider>
  );
}

export default App;