## Guide Complet: Données Solana en Temps Réel

Ce guide vous explique comment utiliser les **vraies données de trading Solana** collectées en temps réel pour votre projet de Copy Trading.

---

## 🎯 Vue d'Ensemble

Votre système collecte maintenant des données **réelles** depuis 3 sources majeures:

### Sources de Données

| Source | Type de Données | Fréquence | Gratuité |
|--------|-----------------|-----------|----------|
| **Birdeye** | Prix, Volume, Holders | 30-60s | ✓ Gratuit |
| **Helius** | Transactions On-Chain, Whale Trades | 30-60s | ✓ Gratuit |
| **Raydium** | Pools de Liquidité, Swaps | 30-60s | ✓ Gratuit |

### Types de Données Disponibles

```
✓ Prix en temps réel
✓ Historique de prix (30 jours)
✓ Volume de trading 24h
✓ Market cap
✓ Transactions de baleine
✓ Distribution des holders
✓ Pools de liquidité
✓ Volatilité
✓ Sentiment du marché
✓ Top gainers/losers
```

---

## 🚀 Démarrage en 5 Minutes

### Étape 1: Configuration

```bash
# 1. Ajouter les clés API dans .env
echo "BIRDEYE_API_KEY=votre_cle" >> .env
echo "HELIUS_API_KEY=votre_cle" >> .env
echo "AUTO_START_DATA_SYNC=true" >> .env
echo "SYNC_FREQUENCY=30000" >> .env
```

### Étape 2: Créer les Tables

```bash
# 2. Initialiser la base de données
psql -d $DATABASE_URL -f scripts/create-solana-data-tables.sql
```

### Étape 3: Démarrer le Service

```bash
# 3. Lancer le bot
npm start

# 4. Vérifier que la synchro est active
curl http://localhost:3000/api/data/sync/stats
```

### Étape 4: Tester les Données

```bash
# 5. Récupérer les top gainers
curl http://localhost:3000/api/data/gainers?limit=10

# 6. Voir les whale trades
curl http://localhost:3000/api/data/whale-transactions?limit=5
```

---

## 📊 Utiliser les Données

### Cas d'Usage 1: Surveiller les Whale Trades

```javascript
// Alerter quand une baleine achète/vend un token

const watchWhales = async () => {
  const response = await fetch('http://localhost:3000/api/data/whale-transactions');
  const { transactions } = await response.json();

  for (const tx of transactions) {
    if (tx.amount_usd > 1000000) {
      console.log(`🐋 WHALE TRADE DETECTED!`);
      console.log(`   Token: ${tx.symbol}`);
      console.log(`   Amount: $${tx.amount_usd.toLocaleString()}`);
      console.log(`   Type: ${tx.transaction_type}`);
      console.log(`   Time: ${new Date(tx.timestamp).toLocaleString()}`);
    }
  }
};

// Lancer toutes les 10 secondes
setInterval(watchWhales, 10000);
```

### Cas d'Usage 2: Trading sur les Top Gainers

```javascript
// Identifier et trader sur les tokens qui montent

const tradeTrendingTokens = async () => {
  // Récupérer les top gainers
  const gainsRes = await fetch('http://localhost:3000/api/data/gainers?limit=5');
  const { gainers } = await gainsRes.json();

  for (const token of gainers) {
    // Vérifier la volatilité
    const volRes = await fetch(
      `http://localhost:3000/api/data/token/${token.mint}/volatility?days=7`
    );
    const { analysis } = await volRes.json();

    // Si volatilité < 50% et gain > 10%, considérer un achat
    if (analysis.volatility < 50 && token.price_24h_change > 10) {
      console.log(`📈 BUY SIGNAL: ${token.symbol}`);
      console.log(`   Price: $${token.price}`);
      console.log(`   24h gain: ${token.price_24h_change}%`);
      console.log(`   Volatility: ${analysis.volatility}%`);

      // Exécuter un trade (à implémenter)
      // await executeTrade(token.mint, 'BUY', 100);
    }
  }
};
```

### Cas d'Usage 3: Analyser la Distribution des Holders

```javascript
// Identifier les tokens avec une bonne distribution (moins de risque)

const findHealthyTokens = async () => {
  const tokens = ['EPjFWaLb3...', 'SOLabbGu...', '...'];

  for (const mint of tokens) {
    const holdRes = await fetch(`http://localhost:3000/api/data/token/${mint}/holders`);
    const { holders } = await holdRes.json();

    // Critères de "santé" du token
    const isSafe = 
      holders.top_10_concentration < 30 &&  // Top 10 n'a pas > 30%
      holders.whale_count < 50;              // Pas trop de baleine

    if (isSafe) {
      console.log(`✅ HEALTHY TOKEN: ${mint}`);
      console.log(`   Top 10: ${holders.top_10_concentration}%`);
      console.log(`   Whales: ${holders.whale_count}`);
    }
  }
};
```

### Cas d'Usage 4: Copier les Trades d'une Baleine

```javascript
// Copier les trades d'une adresse de baleine

const copyWhaleTrades = async (whaleAddress, minAmount = 100000) => {
  // Récupérer tous les whale trades
  const response = await fetch('http://localhost:3000/api/data/whale-transactions');
  const { transactions } = await response.json();

  const whaleTrades = transactions.filter(
    tx => tx.from_address === whaleAddress && tx.amount_usd > minAmount
  );

  for (const trade of whaleTrades) {
    if (trade.transaction_type === 'buy') {
      console.log(`🐋 COPY TRADE: BUY ${trade.symbol}`);
      console.log(`   Whale bought: $${trade.amount_usd}`);
      
      // Copier avec montant proportionnel (ex: 10% du montant de la baleine)
      const copyAmount = trade.amount_usd * 0.1;
      // await executeTrade(trade.mint, 'BUY', copyAmount);
    }
  }
};

// Lancer chaque minute
setInterval(() => copyWhaleTrades('whale_address_here'), 60000);
```

### Cas d'Usage 5: Monitoring de Pools de Liquidité

```javascript
// Trouver les meilleures pools pour du swap

const findBestPools = async () => {
  const response = await fetch('http://localhost:3000/api/data/pools?limit=100');
  const { pools } = await response.json();

  // Critères de bonne pool
  const goodPools = pools.filter(pool => 
    pool.liquidity_usd > 1000000 &&           // Bonne liquidité
    pool.volume_24h > 100000 &&               // Bon volume
    pool.apy > 50                             // APY intéressant
  );

  console.log(`Found ${goodPools.length} pools:`, goodPools);

  for (const pool of goodPools) {
    console.log(`
      Pool: ${pool.pool_name}
      Liquidity: $${pool.liquidity_usd.toLocaleString()}
      Volume 24h: $${pool.volume_24h.toLocaleString()}
      APY: ${pool.apy}%
    `);
  }
};
```

### Cas d'Usage 6: Sentiment Analysis

```javascript
// Analyser le sentiment d'un token

const analyzeSentiment = async (mint) => {
  const [priceRes, holdersRes, sentRes] = await Promise.all([
    fetch(`http://localhost:3000/api/data/token/${mint}/price`),
    fetch(`http://localhost:3000/api/data/token/${mint}/holders`),
    fetch(`http://localhost:3000/api/data/token/${mint}/sentiment`)
  ]);

  const price = await priceRes.json();
  const holders = await holdersRes.json();
  const sentiment = await sentRes.json();

  const analysis = {
    // Facteurs positifs
    bullish: [
      sentiment.sentiment.sentiment_score > 50 ? "✓ Sentiment haussier" : null,
      price.price.price_24h_change > 5 ? "✓ Hausse 24h" : null,
      holders.holders.top_10_concentration < 30 ? "✓ Distribution saine" : null,
    ].filter(Boolean),

    // Facteurs négatifs
    bearish: [
      sentiment.sentiment.sentiment_score < -50 ? "✗ Sentiment baissier" : null,
      price.price.price_24h_change < -5 ? "✗ Baisse 24h" : null,
      holders.holders.whale_count > 100 ? "✗ Beaucoup de baleine" : null,
    ].filter(Boolean)
  };

  console.log(`Sentiment for ${mint}:`);
  console.log(`Bullish: ${analysis.bullish.join(", ")}`);
  console.log(`Bearish: ${analysis.bearish.join(", ")}`);

  return {
    score: sentiment.sentiment.sentiment_score,
    recommendation: analysis.bullish.length > analysis.bearish.length ? "BUY" : "SELL"
  };
};
```

---

## 🔍 Données Avancées

### Volatilité et Risk

```javascript
// Analyser la volatilité pour du risk management

const getRiskProfile = async (mint) => {
  const response = await fetch(
    `http://localhost:3000/api/data/token/${mint}/volatility?days=30`
  );
  const { analysis } = await response.json();

  let riskLevel = "LOW";
  if (analysis.volatility > 100) riskLevel = "EXTREME";
  else if (analysis.volatility > 75) riskLevel = "HIGH";
  else if (analysis.volatility > 50) riskLevel = "MEDIUM";

  return {
    mint,
    volatility: analysis.volatility,
    riskLevel,
    priceRange: {
      min: analysis.min,
      max: analysis.max,
      range: analysis.max - analysis.min
    }
  };
};
```

### Patterns et Trends

```javascript
// Détecter les patterns de prix

const detectTrends = async (mint, hours = 24) => {
  const response = await fetch(
    `http://localhost:3000/api/data/token/${mint}/history?hours=${hours}`
  );
  const { history } = await response.json();

  const prices = history.map(h => parseFloat(h.price));
  
  // Simple moving average
  const sma = prices.slice(-10).reduce((a, b) => a + b) / 10;
  const currentPrice = prices[prices.length - 1];

  if (currentPrice > sma) return "UPTREND";
  if (currentPrice < sma) return "DOWNTREND";
  return "SIDEWAYS";
};
```

---

## 📈 Intégration avec votre Bot de Trading

### Exemple Complet: Auto-Trading Bot

```javascript
import initService from './services/initialization.js';
import solanaDataQuery from './services/solanaDataQuery.js';

class AutoTradingBot {
  async start() {
    // Initialiser tous les services
    const init = await initService.initializeAll();
    console.log('Services initialized:', init);

    // Démarrer la synchro des données
    await initService.startDataSync(30000);

    // Boucle de trading
    this.tradingLoop();
  }

  async tradingLoop() {
    setInterval(async () => {
      // 1. Récupérer les top gainers
      const gainersRes = await fetch('/api/data/gainers?limit=20');
      const { gainers } = await gainersRes.json();

      // 2. Analyser chaque token
      for (const token of gainers) {
        if (token.price_24h_change < 15) continue; // Skip si gain < 15%

        // 3. Vérifier les whale trades
        const whaleRes = await fetch(`/api/data/token/${token.mint}/whale-transactions`);
        const { transactions } = await whaleRes.json();

        const recentWhales = transactions.filter(t => {
          const age = Date.now() - new Date(t.timestamp);
          return age < 3600000; // Dernière heure
        });

        // 4. Si des whales achètent, aussi on achète
        if (recentWhales.some(t => t.transaction_type === 'buy')) {
          console.log(`🚀 BUY SIGNAL: ${token.symbol}`);
          // Exécuter le trade...
        }
      }
    }, 60000); // Vérifier chaque minute
  }
}

// Lancer le bot
const bot = new AutoTradingBot();
bot.start();
```

---

## ⚙️ Configuration Optimale

### Pour Maximum de Données

```env
AUTO_START_DATA_SYNC=true
SYNC_FREQUENCY=30000        # 30 secondes
WATCH_TOKENS=EPjFWaLb3...,So...,9B5...
AUTO_START_MONITORING=true
```

### Pour Performance

```env
AUTO_START_DATA_SYNC=true
SYNC_FREQUENCY=60000        # 60 secondes (moins de charge)
WATCH_TOKENS=EPjFWaLb3      # Seulement les tokens critiques
DATABASE_POOL_SIZE=10
```

---

## 🐛 Dépannage

### "Database connection failed"

```bash
# Vérifier la connexion
psql -d $DATABASE_URL -c "SELECT 1"

# Vérifier les tables
psql -d $DATABASE_URL -c "SELECT * FROM solana_tokens LIMIT 1"
```

### "No data for token"

```bash
# Attendre 30-60 secondes après le lancement
# Puis vérifier:
curl http://localhost:3000/api/data/stats/volume

# Si vide, vérifier les logs
npm start 2>&1 | grep "Error\|ERROR\|error"
```

### "Rate limit exceeded"

```bash
# Augmenter l'intervalle de sync
SYNC_FREQUENCY=60000

# Ou réduire le nombre de tokens
WATCH_TOKENS=EPjFWaLb3
```

---

## 📚 Références

- [Birdeye API Docs](https://docs.birdeye.so)
- [Helius API Docs](https://docs.helius.xyz)
- [Raydium API](https://api.raydium.io)
- [Solana Docs](https://docs.solana.com)

---

## 🎓 Prochaines Étapes

1. **Intégrer l'IA**: Combiner les données avec votre bot IA pour des suggestions intelligentes
2. **Webhooks**: Configurer des webhooks pour des alertes en temps réel
3. **Backtest**: Utiliser l'historique de prix pour tester votre stratégie
4. **ML**: Construire un modèle ML pour prédire les mouvements
5. **Multi-chain**: Étendre à Ethereum, Polygon, etc.

