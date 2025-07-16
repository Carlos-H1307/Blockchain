import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import ABI from "../abi/FortuneRoulette.json";

const CONTRACT_ADDRESS = '0x76430d7e1fdc231c325039d5Dc69dc490eC6bb9e';

const FortuneRoulette = () => {
  const [ethAmount, setEthAmount] = useState("");
  const [loading, setLoading] = useState(false);

  

  const handlePlay = async () => {
    if (!window.ethereum) {
      alert("MetaMask não encontrada. Instale para continuar.");
      return;
    }




    if (!ethAmount || isNaN(parseFloat(ethAmount)) || parseFloat(ethAmount) <= 0) {
      alert("Informe um valor válido em ETH.");
      return;
    }

    if (ethAmount > 0.00015) {
      alert("ETH acima do limite.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

                  // No frontend você pode checar o saldo do contrato
const balance = await provider.getBalance(CONTRACT_ADDRESS);
console.log("Saldo do contrato:", ethers.formatEther(balance), "ETH");
console.log("Saldo do contrato:");

      const tx = await contract.play({
        value: ethers.parseEther(ethAmount)
      });

      const receipt = await tx.wait();

      const resultEvent = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === "Result");

      if (resultEvent) {
        const { player, valueSent, random, payoutToOwner } = resultEvent.args;

        alert(`Resultado da roleta:

🧑 Jogador: ${player}
💰 Valor enviado: ${ethers.formatEther(valueSent)} ETH
🎲 Número sorteado: ${random}
📤 Recompensa enviada ao dono: ${ethers.formatEther(payoutToOwner)} ETH`);
      } else {
        alert("Transação concluída, mas nenhum resultado foi emitido.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao jogar: " + (err?.info?.error?.message || err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">🎰 Fortune Roulette</h2>

        <div className="form-group mb-3">
          <label htmlFor="ethAmount">Valor da aposta (ETH):</label>
          <input
            type="number"
            className="form-control"
            id="ethAmount"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="Ex: 0.01"
            step="0.0001"
            min="0"
          />
        </div>

        <button
          className="btn btn-primary w-100"
          onClick={handlePlay}
          disabled={loading}
        >
          {loading ? "Jogando..." : "Jogar"}
        </button>

        <Link to="/" className="btn btn-link mt-3 w-100">
          Voltar ao Menu
        </Link>
      </div>
    </div>
  );
};

export default FortuneRoulette;
