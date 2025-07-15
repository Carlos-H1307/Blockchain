import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectWallet from '../components/ConnectWallet';
import { Container } from 'react-bootstrap';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("walletConnected") === "true") {
      navigate("/menu");
    }
  }, [navigate]);

  return (
    <Container fluid className="min-vh-100 d-flex">
      <div className="m-auto" style={{ width: '100%', maxWidth: '500px' }}>
        <ConnectWallet />
      </div>
    </Container>
  );
};

export default Home;