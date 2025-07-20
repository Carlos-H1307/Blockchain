import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Modal,
  Navbar,
  Nav,
  Spinner,
  Table
} from 'react-bootstrap';

import { CONTRACT_CONFIG, APP_CONFIG } from './config';
import { debugContract } from './debug-contract';

// ABI e endereço do contrato
const CONTRACT_ABI = CONTRACT_CONFIG.ABI;
const CONTRACT_ADDRESS = CONTRACT_CONFIG.ADDRESS;

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [casinoStats, setCasinoStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [lastRequestId, setLastRequestId] = useState(null);

  // Conectar carteira
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        
        // Verificar se está na rede correta
        const network = await provider.getNetwork();
        console.log("Rede atual:", network.chainId.toString());
        
        if (network.chainId !== 31337n) {
          toast.warning('Mudando para rede Hardhat Local...');
          console.log("Rede esperada: 31337, Rede atual:", network.chainId.toString());
          
          // Tentar adicionar/mudar para a rede local
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x7A69' }], // 31337 em hexadecimal
            });
          } catch (switchError) {
            // Se a rede não existe, adicionar
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x7A69',
                    chainName: 'Hardhat Local',
                    nativeCurrency: {
                      name: 'Ether',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['http://127.0.0.1:8545'],
                    blockExplorerUrls: []
                  }]
                });
              } catch (addError) {
                console.error('Erro ao adicionar rede:', addError);
                toast.error('Configure manualmente no MetaMask: Nome="Hardhat Local", RPC="http://127.0.0.1:8545", Chain ID="31337"');
              }
            } else {
              toast.error('Erro ao mudar rede. Configure manualmente no MetaMask.');
            }
          }
          
          // Aguardar um pouco e verificar novamente
          setTimeout(async () => {
            const newNetwork = await provider.getNetwork();
            if (newNetwork.chainId === 31337n) {
              toast.success('Rede Hardhat Local configurada!');
            }
          }, 1000);
        }
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        
        // Verificar se o Hardhat está respondendo
        try {
          const blockNumber = await provider.getBlockNumber();
          console.log("✅ Hardhat respondendo. Bloco atual:", blockNumber);
        } catch (error) {
          console.error("❌ Hardhat não está respondendo:", error);
          toast.error("Hardhat não está respondendo. Verifique se está rodando em http://127.0.0.1:8545");
          return;
        }
        
        // Debug do contrato antes de conectar
        console.log("🔍 Verificando contrato...");
        await debugContract();
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
        
        toast.success('Carteira conectada com sucesso!');
        
        // Carregar dados iniciais
        loadInitialData(contract, accounts[0]);
      } else {
        toast.error('MetaMask não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao conectar carteira:', error);
      toast.error('Erro ao conectar carteira');
    }
  };

  // Carregar dados iniciais
  const loadInitialData = async (contractInstance, userAccount) => {
    try {
      const [stats, playerData] = await Promise.all([
        contractInstance.getCasinoStats(),
        contractInstance.getPlayerStats(userAccount)
      ]);
      
      setCasinoStats(stats);
      setPlayerStats(playerData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Fazer aposta
  const placeBet = async () => {
    if (!contract || !betAmount || !account) {
      toast.error('Conecte sua carteira primeiro!');
      return;
    }
    
    try {
      setIsLoading(true);
      setIsSpinning(true);
      
      const amount = ethers.parseEther(betAmount);
      
      // Verificar se o contrato está funcionando
      try {
        const [minBet, maxBet] = await Promise.all([
          contract.MIN_BET(),
          contract.MAX_BET()
        ]);
        
        if (amount < minBet) {
          toast.error(`Aposta mínima: ${ethers.formatEther(minBet)} ETH`);
          return;
        }
        
        if (amount > maxBet) {
          toast.error(`Aposta máxima: ${ethers.formatEther(maxBet)} ETH`);
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar limites:', error);
        toast.error('Erro ao verificar limites da aposta. Tente novamente.');
        return;
      }
      
      // Fazer a aposta
      const tx = await contract.placeBet({ value: amount });
      toast.info('Aposta enviada! Aguardando confirmação...');
      
      const receipt = await tx.wait();
      
      // Procurar pelo evento BetPlaced
      const betPlacedEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'BetPlaced';
        } catch {
          return false;
        }
      });
      
      if (betPlacedEvent) {
        const parsed = contract.interface.parseLog(betPlacedEvent);
        const requestId = parsed.args[2];
        setLastRequestId(requestId);
        toast.info(`Aposta processada! Request ID: ${requestId.toString()}`);
        
        // Aguardar resultado
        await waitForGameResult(requestId);
      }
      
    } catch (error) {
      console.error('Erro ao fazer aposta:', error);
      toast.error('Erro ao fazer aposta: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsSpinning(false);
    }
  };

  // Aguardar resultado do jogo
  const waitForGameResult = async (requestId) => {
    try {
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos
      
      const checkResult = async () => {
        attempts++;
        
        try {
          const betInfo = await contract.getBetInfo(requestId);
          
          if (!betInfo.active) {
            // Aposta foi processada, buscar evento de resultado
            const filter = contract.filters.GameResult(null, null, null, null, null, requestId);
            const events = await contract.queryFilter(filter);
            
            if (events.length > 0) {
              const event = events[0];
              const result = {
                player: event.args.player,
                amount: ethers.formatEther(event.args.amount),
                won: event.args.won,
                rouletteResult: event.args.rouletteResult.toString(),
                payout: ethers.formatEther(event.args.payout),
                requestId: event.args.requestId.toString()
              };
              
              setGameResult(result);
              
              if (result.won) {
                toast.success(`🎉 VITÓRIA! Ganhou ${result.payout} ETH!`);
              } else {
                toast.error('❌ Perdeu! Tente novamente!');
              }
              
              // Recarregar estatísticas
              await loadInitialData(contract, account);
              return;
            }
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkResult, 1000);
          } else {
            toast.warning('Tempo limite excedido. Verifique o status da aposta.');
          }
        } catch (error) {
          console.error('Erro ao verificar resultado:', error);
        }
      };
      
      checkResult();
    } catch (error) {
      console.error('Erro ao aguardar resultado:', error);
    }
  };

  // Formatar endereço da carteira
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Formatar ETH
  const formatETH = (wei) => {
    return ethers.formatEther(wei || 0);
  };

  // Verificar owner do contrato
  const checkOwner = async () => {
    if (!contract) return;
    
    try {
      const owner = await contract.owner();
      console.log("Owner do contrato:", owner);
      console.log("Sua conta:", account);
      console.log("É owner?", owner.toLowerCase() === account?.toLowerCase());
      
      if (owner.toLowerCase() === account?.toLowerCase()) {
        toast.success('Você é o owner do contrato!');
      } else {
        toast.warning(`Você não é o owner. Owner: ${owner.slice(0, 6)}...${owner.slice(-4)}`);
      }
    } catch (error) {
      console.error('Erro ao verificar owner:', error);
    }
  };

  // Adicionar fundos ao casino (função de admin)
  const addHouseFunds = async () => {
    if (!contract || !account) {
      toast.error('Conecte sua carteira primeiro!');
      return;
    }

    // Verificar se é o owner
    await checkOwner();

    try {
      const amount = ethers.parseEther("1.0"); // 1 ETH
      const tx = await contract.addHouseFunds({ value: amount });
      toast.info('Adicionando fundos ao casino...');
      
      await tx.wait();
      toast.success('Fundos adicionados com sucesso!');
      
      // Recarregar estatísticas
      await loadInitialData(contract, account);
    } catch (error) {
      console.error('Erro ao adicionar fundos:', error);
      if (error.message.includes('Only callable by owner')) {
        toast.error('Apenas o owner pode adicionar fundos. Use a Account #0 do Hardhat.');
      } else {
        toast.error('Erro ao adicionar fundos: ' + error.message);
      }
    }
  };

  return (
    <div className="casino-container">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home" className="navbar-brand">
            🎰 Casino Roleta
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {!account ? (
                <Button 
                  variant="primary" 
                  onClick={connectWallet}
                  className="connect-wallet-btn"
                >
                  Conectar Carteira
                </Button>
              ) : (
                <div className="d-flex align-items-center">
                  <Badge bg="success" className="me-3">
                    {formatAddress(account)}
                  </Badge>
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={() => setShowStats(true)}
                    className="me-2"
                  >
                    📊 Estatísticas
                  </Button>
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={async () => {
                      console.log("🔍 Debug do contrato...");
                      await debugContract();
                    }}
                    className="me-2"
                  >
                    🔍 Debug
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={addHouseFunds}
                    className="me-2"
                  >
                    💰 Adicionar Fundos
                  </Button>
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    onClick={checkOwner}
                  >
                    👑 Verificar Owner
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="casino-card">
              <Card.Body className="text-center p-5">
                <h1 className="mb-4">🎰 Roleta da Fortuna</h1>
                
                {/* Roleta */}
                <div className={`roulette-wheel ${isSpinning ? 'spinning' : ''}`}>
                  {gameResult && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <Badge bg={gameResult.won ? 'success' : 'danger'} className="fs-4">
                        {gameResult.rouletteResult}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Seção de Aposta */}
                {account ? (
                  <div className="bet-section mt-4">
                    <h3>Faça sua aposta!</h3>
                    <p className="mb-3">
                      <strong>Verde (1-25):</strong> Ganha 2x | <strong>Vermelho (26-50):</strong> Perde
                    </p>
                    
                    <Row className="justify-content-center">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Valor da Aposta (ETH)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.001"
                            placeholder="0.001"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            disabled={isLoading}
                          />
                          <Form.Text className="text-light">
                            Mín: 0.001 ETH | Máx: 0.005 ETH
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      variant="warning"
                      size="lg"
                      onClick={placeBet}
                      disabled={isLoading || !betAmount}
                      className="bet-btn"
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Processando...
                        </>
                      ) : (
                        '🎲 FAZER APOSTA'
                      )}
                    </Button>

                    {casinoStats && (
                      <div className="mt-3">
                        <small className="text-light">
                          Saldo da Casa: {formatETH(casinoStats.balance)} ETH
                        </small>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="info" className="mt-4">
                    <h4>Conecte sua carteira para começar!</h4>
                    <p>Você precisa ter uma carteira Web3 (como MetaMask) para jogar.</p>
                  </Alert>
                )}

                {/* Resultado do Jogo */}
                {gameResult && (
                  <Alert 
                    variant={gameResult.won ? 'success' : 'danger'} 
                    className={`mt-4 ${gameResult.won ? 'win-animation' : 'lose-animation'}`}
                  >
                    <h4>
                      {gameResult.won ? '🎉 VITÓRIA!' : '❌ DERROTA!'}
                    </h4>
                    <p>
                      <strong>Resultado:</strong> {gameResult.rouletteResult} | 
                      <strong> Aposta:</strong> {gameResult.amount} ETH
                      {gameResult.won && (
                        <> | <strong> Ganhou:</strong> {gameResult.payout} ETH</>
                      )}
                    </p>
                  </Alert>
                )}

                {/* Estatísticas Rápidas */}
                {playerStats && (
                  <Row className="mt-4">
                    <Col md={4}>
                      <div className="stats-card text-center">
                        <h5>🎯 Vitórias</h5>
                        <h3>{playerStats.wins.toString()}</h3>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="stats-card text-center">
                        <h5>💔 Derrotas</h5>
                        <h3>{playerStats.losses.toString()}</h3>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="stats-card text-center">
                        <h5>💰 Lucro</h5>
                        <h3 className={playerStats.netResult >= 0 ? 'text-success' : 'text-danger'}>
                          {formatETH(playerStats.netResult)}
                        </h3>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal de Estatísticas Detalhadas */}
      <Modal show={showStats} onHide={() => setShowStats(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📊 Estatísticas Detalhadas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {playerStats && (
            <>
              <h5>Estatísticas do Jogador</h5>
              <Table striped bordered hover>
                <tbody>
                  <tr>
                    <td>Total de Jogos</td>
                    <td>{playerStats.totalGames.toString()}</td>
                  </tr>
                  <tr>
                    <td>Vitórias</td>
                    <td>{playerStats.wins.toString()}</td>
                  </tr>
                  <tr>
                    <td>Derrotas</td>
                    <td>{playerStats.losses.toString()}</td>
                  </tr>
                  <tr>
                    <td>Total Apostado</td>
                    <td>{formatETH(playerStats.totalBetAmount)} ETH</td>
                  </tr>
                  <tr>
                    <td>Total Ganho</td>
                    <td>{formatETH(playerStats.totalWonAmount)} ETH</td>
                  </tr>
                  <tr>
                    <td>Resultado Líquido</td>
                    <td className={playerStats.netResult >= 0 ? 'text-success' : 'text-danger'}>
                      {formatETH(playerStats.netResult)} ETH
                    </td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}

          {casinoStats && (
            <>
              <h5 className="mt-4">Estatísticas do Casino</h5>
              <Table striped bordered hover>
                <tbody>
                  <tr>
                    <td>Saldo da Casa</td>
                    <td>{formatETH(casinoStats.balance)} ETH</td>
                  </tr>
                  <tr>
                    <td>Total de Apostas</td>
                    <td>{casinoStats.totalBets.toString()}</td>
                  </tr>
                  <tr>
                    <td>Total de Pagamentos</td>
                    <td>{formatETH(casinoStats.totalPayoutsAmount)} ETH</td>
                  </tr>
                  <tr>
                    <td>Saldo do Contrato</td>
                    <td>{formatETH(casinoStats.contractBalance)} ETH</td>
                  </tr>
                  <tr>
                    <td>Apostas Pendentes</td>
                    <td>{casinoStats.pendingBets.toString()}</td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td>
                      <Badge bg={casinoStats.isPaused ? 'danger' : 'success'}>
                        {casinoStats.isPaused ? 'Pausado' : 'Ativo'}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer {...APP_CONFIG.TOAST_CONFIG} />
    </div>
  );
}

export default App; 