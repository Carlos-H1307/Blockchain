import React from 'react';
import { FaCoins, FaRedo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import MenuCard from '../components/MenuCard';
import { Button, Container } from 'react-bootstrap';

const Menu = () => {
  const account = localStorage.getItem("account");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("account");
    navigate("/");
  };

  return (
    <div className="d-flex flex-column gap-5 m-5">
      <h1>Jogos Disponíveis.</h1>
      <div className="menu-page d-flex flex-row gap-5" >
        <div style={{ position: "absolute", top: "20px", right: "20px" }}>
          <p>Conectado como: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
          <Button variant="secondary" onClick={handleLogout}>Desconectar</Button>
        </div>
        
          <MenuCard
            title="Fortune Roulette"
            //description="Gire a roleta da sorte e teste sua sorte!"
            path="/fortune-roulette"
            imgPath="roleta-menu.png"
            />
          
          <MenuCard
            title="Coin Flip"
            //description="Cara ou coroa? Faça sua aposta!"
            path="/coin-flip"
            imgPath="moeda-menu.png"
            />
      </div>
    </div>
  );
};

export default Menu;