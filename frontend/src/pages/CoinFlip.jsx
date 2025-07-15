import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import ABI from "../abi/CoinFlip.json";
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';
import Coin3D from "../components/Moeda";

const CONTRACT_ADDRESS = "0xa11670095e96939D0d124C4c01028EF6FA7fc390";

const CoinFlip = () => {
  const coin3DRef = useRef();
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState("");

  // Carrega o contrato quando o componente monta
  useEffect(() => {
    async function loadContract() {
      if (!window.ethereum) return;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(contractInstance);
    }
    
    loadContract();
  }, []);

  function animarMoeda(opcao) {
    if (coin3DRef.current) {
      coin3DRef.current.jogarMoeda(opcao);
    }
  }

  async function play(guess) {
    if (!contract) {
      alert("Contrato não carregado.");
      return;
    }

    try {
      setIsLoading(true);
      const tx = await contract.flip(guess, {
        value: ethers.parseEther("0.0001"),
      });
      
      const receipt = await tx.wait();
      
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            const event = contract.interface.parseLog(log);
            if (event && event.name === "Result") {
              const [player, didWin, amount] = event.args;
              alert(didWin ? "🎉 Você ganhou!" : "😢 Você perdeu.");
              setLastResult(didWin ? "Ganhou!" : "Perdeu.");
              break;
            }
          } catch (e) {
            console.log("Log não é do contrato CoinFlip:", log);
          }
        }
      }
    } catch (err) {
      console.error("Erro na transação:", err);
      alert("Erro ao apostar. Verifique o console.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <Link to="/menu" style={{ display: "block", marginBottom: "20px" }}>
        ← Voltar ao Menu
      </Link>
      
      <h1>Coin Flip DApp</h1>
      {lastResult && <p>Último resultado: {lastResult}</p>}
      
      <div className="h-50 d-flex flex-row justify-content-around gap-5 " style={{ width:"600px"}} >
        <div className="d-flex flex-column gap-5 justify-content-center" style={{width:"250px"}}>
          <Button 
            onClick={() => play(true)} 
            disabled={isLoading}
            style={{ padding: "10px 20px"}}
          >
            {isLoading ? "Processando..." : "Apostar em Cara"}
          </Button>
          <Button 
            onClick={() => play(false)} 
            disabled={isLoading}
            style={{ padding: "10px 20px"}}
          >
            {isLoading ? "Processando..." : "Apostar em Coroa"}
          </Button>
          <button onClick={() => animarMoeda("cara")} >cara</button>
        </div >

        <div>
          <Coin3D ref={coin3DRef}/>
        </div>
      </div>
      
    </div>
  );
};

export default CoinFlip;