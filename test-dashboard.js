import './dashboard/server.js'; // 🔥 Démarrer le serveur dans ce MÊME processus
import riskManager from "./services/riskManager.js";
import { config } from "./config.js";

async function runTestSimulation() {
    console.log("🚀 Lancement de la simulation de test pour le tableau de bord...");

    // Reset any existing data
    riskManager.resetDailyStats();

    // Simulate opening a trade
    console.log("➡️ Ouverture d'une position d'achat (Simulation)");
    const fakeMint1 = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // Bonk
    const fakeMint2 = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"; // Jupiter
    riskManager.recordTrade("buy", fakeMint1, config.trading.sniperAmount, 0.000014, "fake_tx_hash_1");

    setTimeout(() => {
        console.log("➡️ Mise à jour des prix (Simulation)");
        // Simulate price increase
        riskManager.updatePositionPrice(fakeMint1, 0.000020);

        // Simulate opening a second trade
        console.log("➡️ Ouverture d'une 2e position d'achat (Simulation)");
        riskManager.recordTrade("buy", fakeMint2, config.trading.sniperAmount, 0.005, "fake_tx_hash_2");

    }, 2000);

    setTimeout(() => {
        console.log("➡️ Mise à jour des prix 2 (Simulation)");
        riskManager.updatePositionPrice(fakeMint1, 0.000028); // +100% prof
        riskManager.updatePositionPrice(fakeMint2, 0.003);    // loss
    }, 4000);

    setTimeout(() => {
        console.log("➡️ Vente d'une position avec profit (Simulation)");
        riskManager.recordTrade("sell", fakeMint1, config.trading.sniperAmount, 0.000028, "fake_tx_hash_3");

        console.log("✅ Simulation en cours... Regardez votre navigateur sur http://localhost:3000/monitoring.html");
        // Keep alive to let the dashboard fetch data
        setInterval(() => { }, 1000);
    }, 6000);
}

runTestSimulation();
