import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CoinFlip from './pages/CoinFlip';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
      <Router>
        <Routes>
          <Route path="" element={<CoinFlip />} />
        </Routes>
      </Router>
  );
}

export default App;