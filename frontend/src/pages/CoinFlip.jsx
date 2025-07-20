import React, { useEffect, useState, useRef } from "react";

// ABI do contrato CoinFlip (inalterado)
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vrfCoordinatorV2",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "subscriptionId",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "keyHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "CoinFlip__RequestNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CoinFlip__TransferFailed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "guess",
        "type": "bool"
      }
    ],
    "name": "FlipRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "win",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Result",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "guess",
        "type": "bool"
      }
    ],
    "name": "flip",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBetAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Endereço do contrato (inalterado)
const CONTRACT_ADDRESS = "0x02a434865453966518D1D6060aD0691CA436eA60";

// Componente da Moeda 3D (lógica inalterada, classes atualizadas para Bootstrap)
const Coin3D = ({ isFlipping, result, onAnimationEnd }) => {
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef();

  useEffect(() => {
    if (isFlipping) {
      let startTime;
      const duration = 3000; // 3 segundos
      const totalRotations = result === "heads" ? 1800 : 1980; // 5 voltas + posição final

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function para desaceleração suave
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setRotation(totalRotations * easeOut);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onAnimationEnd?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlipping, result, onAnimationEnd]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '16rem' }}>
      <div
        className="position-relative"
        style={{
          width: '8rem',
          height: '8rem',
          transform: `rotateX(${rotation}deg)`,
          transformStyle: "preserve-3d",
          transition: isFlipping ? "none" : "transform 0.3s ease"
        }}
      >
        {/* Cara da moeda */}
        <div className="coin-face coin-heads position-absolute w-100 h-100 rounded-circle shadow-lg d-flex align-items-center justify-content-center fs-1 fw-bold">
          H
        </div>
        {/* Coroa da moeda */}
        <div
          className="coin-face coin-tails position-absolute w-100 h-100 rounded-circle shadow-lg d-flex align-items-center justify-content-center fs-1 fw-bold"
          style={{ transform: "rotateX(180deg)" }}
        >
          T
        </div>
      </div>
    </div>
  );
};


// Componente principal
const CoinFlipDApp = () => {
  // Todos os hooks de estado e lógica são mantidos
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameState, setGameState] = useState("idle"); // idle, betting, flipping, result
  const [lastResult, setLastResult] = useState(null);
  const [balance, setBalance] = useState("0");
  const [betAmount, setBetAmount] = useState("0.0001");
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalBets: 0 });
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Funções helper (inalteradas)
  const formatEther = (wei) => {
    return (parseFloat(wei) / Math.pow(10, 18)).toFixed(4);
  };

  const parseEther = (eth) => {
    return (parseFloat(eth) * Math.pow(10, 18)).toString();
  };

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-4), { message, type, timestamp }]);
  };

  // Lógica de conexão e aposta (inalterada)
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Por favor, instale a MetaMask!");
        return;
      }
      setIsLoading(true);
      addLog("Conectando carteira...", "info");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);
      setIsConnected(true);
      const balance = await window.ethereum.request({ method: 'eth_getBalance', params: [account, 'latest'] });
      setBalance(formatEther(parseInt(balance, 16)));
      addLog("Carteira conectada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao conectar:", error);
      addLog("Erro ao conectar carteira", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!account) return;
    // A lógica de escuta de eventos (simulada) permanece a mesma
  }, [account]);

  const placeBet = async (guess) => {
    if (!account) {
      addLog("Carteira não conectada", "error");
      return;
    }
    try {
      setIsLoading(true);
      setGameState("betting");
      addLog(`Apostando em ${guess ? "Cara" : "Coroa"}...`, "info");

      const methodId = "0x6b509d5e";
      const paddedGuess = guess ? "0000000000000000000000000000000000000000000000000000000000000001" : "0000000000000000000000000000000000000000000000000000000000000000";
      const data = methodId + paddedGuess;

      const transactionParameters = {
        to: CONTRACT_ADDRESS,
        from: account,
        value: parseEther("0.0001").toString(16),
        gas: '0x493E0',
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      addLog("Transação enviada: " + txHash.slice(0, 10) + "...", "info");

      // A simulação de evento permanece a mesma
      setTimeout(() => {
        const won = Math.random() > 0.5;
        const coinResult = won ? "heads" : "tails";
        setLastResult({ won, amount: won ? "0.0002" : "0", coinResult });
        addLog(won ? "Você ganhou!" : "Você perdeu!", won ? "success" : "error");
        setStats(prev => ({
          ...prev,
          totalBets: prev.totalBets + 1,
          wins: prev.wins + (won ? 1 : 0),
          losses: prev.losses + (won ? 0 : 1)
        }));
        setGameState("flipping");
        setIsFlipping(true);
      }, 3000);

    } catch (error) {
      console.error("Erro na aposta:", error);
      addLog("Erro na aposta: " + error.message.slice(0, 50), "error");
      setGameState("idle");
      setIsLoading(false);
    }
  };

  const onCoinAnimationEnd = () => {
    setIsFlipping(false);
    setGameState("result");
    setIsLoading(false);
    setTimeout(() => {
      setGameState("idle");
      setLastResult(null);
    }, 3000);
  };

  return (
    <div className="dapp-bg min-vh-100 text-white">
      <div className="container py-5">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-2 fw-bold mb-3 text-gradient-gold">
            🪙 Coin Flip DApp
          </h1>
          <p className="fs-5 text-white-50">
            Aposte em Cara ou Coroa usando Chainlink VRF
          </p>
        </div>

        {!isConnected ? (
          // Tela de conexão
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="glass-panel p-5 text-center">
                <h2 className="fw-bold mb-4">Conectar Carteira</h2>
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="btn btn-primary btn-lg w-100 fw-semibold hover-scale"
                >
                  {isLoading ? "Conectando..." : "Conectar MetaMask"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Interface principal
          <div className="row g-5">
            {/* Painel principal */}
            <div className="col-lg-8">
              {/* Informações da conta */}
              <div className="glass-panel p-4 mb-4">
                <h2 className="fs-5 fw-bold mb-3">Informações da Conta</h2>
                <div className="row">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <p className="text-white-50 mb-1">Endereço:</p>
                    <p className="font-monospace small">{account.slice(0, 8)}...{account.slice(-8)}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="text-white-50 mb-1">Saldo ETH:</p>
                    <p className="fw-bold">{parseFloat(balance).toFixed(4)} ETH</p>
                  </div>
                </div>
              </div>

              {/* Área do jogo */}
              <div className="glass-panel p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="display-5 fw-bold mb-2">Faça sua Aposta</h2>
                  <p className="text-white-50">Aposte 0.0001 ETH e tente dobrar seu dinheiro!</p>
                </div>

                <Coin3D
                  isFlipping={isFlipping}
                  result={lastResult?.coinResult}
                  onAnimationEnd={onCoinAnimationEnd}
                />

                {/* Status do jogo */}
                <div className="text-center mb-4" style={{minHeight: "6rem"}}>
                  {gameState === "idle" && (
                    <p className="fs-5 text-white-50">Escolha Cara ou Coroa para começar</p>
                  )}
                  {gameState === "betting" && (
                    <p className="fs-5 text-warning">Enviando aposta...</p>
                  )}
                  {gameState === "flipping" && (
                    <p className="fs-5 text-info">🎲 Aguardando resultado do oráculo...</p>
                  )}
                  {gameState === "result" && lastResult && (
                    <div className={`fs-4 fw-bold ${lastResult.won ? 'text-success' : 'text-danger'}`}>
                      {lastResult.won ? '🎉 Você Ganhou!' : '😔 Você Perdeu!'}
                      {lastResult.won && (
                        <p className="fs-6 text-success-emphasis mt-2">
                          Ganhou: {lastResult.amount} ETH
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botões de aposta */}
                <div className="d-grid gap-3 d-sm-flex justify-content-center">
                  <button
                    onClick={() => placeBet(true)}
                    disabled={isLoading || gameState !== "idle"}
                    className="btn btn-heads btn-lg fw-bold text-white hover-scale"
                  >
                    🪙 Apostar em CARA
                    <div className="small fw-normal">0.0001 ETH</div>
                  </button>
                  <button
                    onClick={() => placeBet(false)}
                    disabled={isLoading || gameState !== "idle"}
                    className="btn btn-tails btn-lg fw-bold text-white hover-scale"
                  >
                    🪙 Apostar em COROA
                    <div className="small fw-normal">0.0001 ETH</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Painel lateral */}
            <div className="col-lg-4">
              <div className="d-flex flex-column gap-4">
                {/* Estatísticas */}
                <div className="glass-panel p-4">
                  <h3 className="fs-5 fw-bold mb-3">📊 Estatísticas</h3>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between">
                      <span>Total de Apostas:</span>
                      <span className="fw-bold">{stats.totalBets}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Vitórias:</span>
                      <span className="fw-bold">{stats.wins}</span>
                    </div>
                    <div className="d-flex justify-content-between text-danger">
                      <span>Derrotas:</span>
                      <span className="fw-bold">{stats.losses}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Taxa de Vitória:</span>
                      <span className="fw-bold">
                        {stats.totalBets > 0 ? ((stats.wins / stats.totalBets) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Log de atividades */}
                <div className="glass-panel p-4">
                  <h3 className="fs-5 fw-bold mb-3">📝 Log de Atividades</h3>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                    {logs.map((log, index) => (
                      <div key={index} className="small">
                        <span className="text-white-50 me-2">{log.timestamp}</span>
                        <div className={`${
                          log.type === 'success' ? 'text-success' :
                          log.type === 'error' ? 'text-danger' : 'text-info'
                        }`}>
                          {log.message}
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-white-50 small">Nenhuma atividade ainda...</p>
                    )}
                  </div>
                </div>

                {/* Como jogar */}
                <div className="glass-panel p-4">
                  <h3 className="fs-5 fw-bold mb-3">❓ Como Jogar</h3>
                  <ol className="text-white-50 ps-3 small">
                    <li>Escolha Cara ou Coroa</li>
                    <li>Confirme a transação na MetaMask</li>
                    <li>Aguarde o resultado do oráculo Chainlink</li>
                    <li>Se acertar, receba o dobro da aposta!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS customizados para efeitos especiais */}
      <style jsx>{`
        .dapp-bg {
          background-color: #0c0a1e;
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0);
          background-size: 20px 20px;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .text-gradient-gold {
          background: -webkit-linear-gradient(45deg, #f3ec78, #af4261);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hover-scale {
          transition: transform 0.2s ease-in-out;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .hover-scale:disabled {
          transform: none;
        }
        
        .btn-heads {
          background-image: linear-gradient(to right, #f2c94c, #f2994a);
          border: none;
        }
        .btn-tails {
          background-image: linear-gradient(to right, #8e9eab, #eef2f3);
          color: #333 !important; /* Texto escuro para melhor contraste */
          border: none;
        }
        
        .coin-face {
          backface-visibility: hidden;
        }
        .coin-heads {
          background-image: linear-gradient(to bottom right, #f2c94c, #f2994a);
          color: #855b08;
        }
        .coin-tails {
          background-image: linear-gradient(to bottom right, #bdbdbd, #616161);
          color: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default CoinFlipDApp;