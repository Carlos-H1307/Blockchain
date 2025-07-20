import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import ABI from "../abi/CoinFlip.json";
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';
import Coin3D from "../components/Moeda";
import { useMessage } from "../contexts/MessageContext";

// Certifique-se que este é o endereço correto do seu contrato implantado
const CONTRACT_ADDRESS = "0x02a434865453966518D1D6060aD0691CA436eA60";

const CoinFlip = () => {
    const { showFullScreenMessage } = useMessage();
    const coin3DRef = useRef();

    const [contract, setContract] = useState(null);
    const [signerAddress, setSignerAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastResult, setLastResult] = useState({ won: false, message: "" });
    const [provider, setProvider] = useState(null);

    // Funções de feedback para o usuário
    const handleWin = () => showFullScreenMessage("Você ganhou!!", "#8f2");
    const handleLose = () => showFullScreenMessage("Você Perdeu!!", "#f22");

    // Carrega o contrato e o endereço do usuário ao montar o componente
    useEffect(() => {
        async function loadProviderAndContract() {
            if (!window.ethereum) {
                alert("Por favor, instale a MetaMask!");
                return;
            }
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            setContract(contractInstance);
            setSignerAddress(address);
        }
        
        loadProviderAndContract();
    }, []);


    useEffect(() => {
        if (!contract || !signerAddress) return;
    
        const handleFlipRequested = (requestId, player, guess) => {
            if (player.toLowerCase() === signerAddress.toLowerCase()) {
                console.log("Aposta registrada, aguardando VRF...");
            }
        };
    
        contract.on("FlipRequested", handleFlipRequested);
        
        return () => {
            contract.off("FlipRequested", handleFlipRequested);
        };
    }, [contract, signerAddress]);

    // NOVO: useEffect para escutar o evento "Result" do contrato
    useEffect(() => {
        if (!contract || !signerAddress) return;

        const handleResultEvent = (requestId, player, didWin, amount) => {
            // Apenas reage a eventos destinados ao jogador atual
            if (player.toLowerCase() === signerAddress.toLowerCase()) {
                console.log("Evento 'Result' recebido:", { player, didWin });

                // Define qual lado da moeda mostrar na animação
                const playerGuessWasHeads = lastResult.playerGuess; // Usamos a escolha que salvamos
                const correctSide = playerGuessWasHeads ? "cara" : "coroa";
                const oppositeSide = playerGuessWasHeads ? "coroa" : "cara";

                if (didWin) {
                    animarMoeda(correctSide);
                    setLastResult(prev => ({ ...prev, won: true, message: "Ganhou!" }));
                } else {
                    animarMoeda(oppositeSide);
                    setLastResult(prev => ({ ...prev, won: false, message: "Perdeu!" }));
                }
                
                // O processo terminou, podemos reativar os botões
                setIsLoading(false);
            }
        };

        const checkContractBalance = async () => {
            if (!provider) return;
            const balance = await provider.getBalance(CONTRACT_ADDRESS);
            console.log("Saldo do contrato:", ethers.formatEther(balance));
        };

        checkContractBalance();

        contract.on("Result", handleResultEvent);

        // Função de limpeza para remover o listener quando o componente for desmontado
        return () => {
            contract.off("Result", handleResultEvent);
        };

    }, [contract, signerAddress, lastResult.playerGuess, provider]); // Adicionado provider na dependência

    function animarMoeda(opcao) {
        if (coin3DRef.current) {
            coin3DRef.current.jogarMoeda(opcao);
        }
    }

    async function play(guessIsHeads) {
        console.log("1. Função 'play' iniciada. Palpite:", guessIsHeads);
    
        console.log("2. Verificando o objeto 'contract'...");
        if (!contract) {
            console.error("ERRO: O objeto do contrato é nulo! A inicialização no useEffect pode ter falhado.");
            alert("Contrato não carregado. Verifique o console do desenvolvedor.");
            return;
        }
    
        try {
            const signer = await contract.runner;
            if (!signer) {
                console.error("ERRO: Não há um 'signer' (carteira conectada) associado ao contrato.");
                alert("Parece que sua carteira não está conectada corretamente. Tente reconectar.");
                return;
            }
            console.log("3. Objeto 'contract' e 'signer' parecem válidos. Endereço do Signer:", await signer.getAddress());
            
            setIsLoading(true);
            setLastResult({ 
                message: "Aguardando resultado do oráculo...", 
                playerGuess: guessIsHeads 
            });
    
            console.log("4. Preparando para chamar 'contract.flip'. Este é o último passo antes da MetaMask.");
            const tx = await contract.flip(guessIsHeads, {
                value: ethers.parseEther("0.0001"),
            });
            
            console.log("5. MetaMask apareceu e a transação foi enviada. Aguardando confirmação...", tx);
            await tx.wait();
            console.log("6. Transação confirmada na blockchain.");
    
        } catch (err) {
            console.error("ERRO CRÍTICO na função play:", err);
            alert("Ocorreu um erro ANTES de enviar a transação. Verifique o console para detalhes.");
            setIsLoading(false);
        }
    }

    return (
        <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
            <Link to="/menu" style={{ display: "block", marginBottom: "20px" }}>
                ← Voltar ao Menu
            </Link>
            
            <h1>Coin Flip</h1>
            {lastResult.message && <p>Último resultado: {lastResult.message}</p>}
            
            <div className="h-50 d-flex flex-row justify-content-around gap-5" style={{width:"600px"}}>
                <div className="d-flex flex-column gap-5 justify-content-center" style={{width:"250px"}}>
                    <Button 
                        onClick={() => play(true)} 
                        disabled={isLoading}
                        style={{ padding: "10px 20px"}}
                    >
                        {isLoading ? "Aguardando..." : "Apostar em Cara"}
                    </Button>
                    <Button 
                        onClick={() => play(false)} 
                        disabled={isLoading}
                        style={{ padding: "10px 20px"}}
                    >
                        {isLoading ? "Aguardando..." : "Apostar em Coroa"}
                    </Button>
                </div >
                <div>
                    <Coin3D ref={coin3DRef} onStop={() => {
                        // A mensagem de tela cheia agora é acionada após a animação
                        if (lastResult.message === "Ganhou!") {
                            handleWin();
                        } else if (lastResult.message === "Perdeu!"){
                            handleLose();
                        }
                    }} />
                </div>
            </div>
        </div>
    );
};

export default CoinFlip;