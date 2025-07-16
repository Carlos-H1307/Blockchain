import React from 'react';
import { useState } from 'react';
import { ethers } from 'ethers';
import { Card, Button, Spinner, Alert, Container } from 'react-bootstrap';

const ConnectWallet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function connectWallet() {
    if (!window.ethereum) {
      setError("MetaMask não encontrada. Por favor instale a extensão.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("account", address);
      
      window.location.href = "/menu";
    } catch (err) {
      console.error("Erro ao conectar:", err);
      setError(err.message || "Erro ao conectar a carteira");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container 
      fluid 
      className="min-vh-100 d-flex justify-content-center align-items-center p-5"
    >
      <Card className="shadow" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h2>🦊 Web3 Casino</h2>
            <p className="text-muted">Conecte sua carteira para começar</p>
          </div>

          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          <Button 
            variant="primary" 
            size="lg"
            onClick={connectWallet} 
            disabled={isLoading}
            className="w-100 mb-3 py-2"
          >
            {isLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Conectando...
              </>
            ) : 'Conectar MetaMask'}
          </Button>

          <div className="text-center small text-muted">
            Não tem MetaMask?{' '}
            <a 
              href="https://metamask.io/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Instale aqui
            </a>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ConnectWallet;