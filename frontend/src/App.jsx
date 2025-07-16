import { useState } from "react";
import { ethers } from "ethers";
import ABI from "./abi/CoinFlip.json";

const CONTRACT_ADDRESS = "0xC77656Eb0db15964694f5749d0EC78f54EEf0Ca7";

function App() {
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask não encontrada");

    const _provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await _provider.getSigner();
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    setProvider(_provider);
    setContract(_contract);
    setConnected(true);
  }

  async function play(guess) {
    if (!contract) return;

    const tx = await contract.flip(guess, {
      value: ethers.parseEther("0.01"),
    });
    await tx.wait();
    alert("Aposta feita!");
  }

  return (
    <div>
      <h1>Coin Flip DApp</h1>
      {!connected ? (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      ) : (
        <>
          <button onClick={() => play(true)}>Apostar em Cara</button>
          <button onClick={() => play(false)}>Apostar em Coroa</button>
        </>
      )}
    </div>
  );
}

export default App;
