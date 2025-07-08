import { useState } from "react";
import { ethers } from "ethers";
import ABI from "./abi/CoinFlip.json";

const CONTRACT_ADDRESS = "0xa11670095e96939D0d124C4c01028EF6FA7fc390";

function App() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask não encontrada");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      setContract(contractInstance);
      setAccount(address);
      setConnected(true);
    } catch (err) {
      console.error("Erro ao conectar:", err);
      alert("Erro ao conectar a carteira.");
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
    
    // Espera a transação ser minerada e captura os logs
    const receipt = await tx.wait();
    
    // Verifica se há logs e decodifica o evento
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
    } else {
      alert("Nenhum evento encontrado. Verifique o contrato.");
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
      <h1>🪙 Coin Flip DApp</h1>

      {!connected ? (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      ) : (
        <div>
          <p>Carteira conectada: {account}</p>
          <button onClick={() => play(true)} disabled={isLoading}>
            Apostar em Cara
          </button>
          <button onClick={() => play(false)} disabled={isLoading}>
            Apostar em Coroa
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
