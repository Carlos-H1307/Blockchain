import React from 'react';
import { Link } from 'react-router-dom';

const FortuneRoulette = () => {
  return (
    <div className="fortune-page">
      <h1>Fortune Roulette</h1>
      {/* Conteúdo da roleta aqui */}
      <Link to="/" className="back-button">Voltar ao Menu</Link>
    </div>
  );
};

export default FortuneRoulette;