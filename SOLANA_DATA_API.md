## Solana Real-Time Data API

### Vue d'ensemble

Ce système collecte des données **Solana en temps réel** (toutes les 30-60 secondes) depuis plusieurs sources:
- **Birdeye**: Prix, volume, holders
- **Helius**: Transactions on-chain, whale trades
- **Raydium**: Pools de liquidité

### Démarrage Rapide

#### 1. Ajouter les variables d'environnement

```env
# .env
BIRDEYE_API_KEY=votre_cle_birdeye
HELIUS_API_KEY=votre_cle_helius
DATABASE_URL=postgresql://...
```

#### 2. Créer les tables

```bash
psql -d $DATABASE_URL -f scripts/create-solana-data-tables.sql
```

#### 3. Démarrer la synchronisation

```bash
curl -X POST http://localhost:3000/api/data/sync/start \
  -H "Content-Type: application/json" \
  -d '{"frequency": 30000}'
```

### Endpoints API

#### Gestion de la Synchronisation

**Démarrer la synchro**
```
POST /api/data/sync/start
Body: { "frequency": 30000 }  // en milliseconds
```

**Arrêter la synchro**
```
POST /api/data/sync/stop
```

#### Données de Prix

**Prix actuel d'un token**
```
GET /api/data/token/{mint}/price
Response: {
  price: 0.1234,
  market_cap: 123456789,
  volume_24h: 5000000,
  price_24h_change: 5.25
}
```

**Historique de prix**
```
GET /api/data/token/{mint}/history?hours=24
Response: [
  { price: 0.1234, market_cap: 123456789, recorded_at: "2024-01-01T00:00:00Z" },
  ...
]
```

#### Mouvements de Marché

**Top gainers (24h)**
```
GET /api/data/gainers?limit=20
Response: [
  { mint: "...", price: 0.1234, price_24h_change: 15.5, volume_24h: 500000 },
  ...
]
```

**Top losers (24h)**
```
GET /api/data/losers?limit=20
```

#### Transactions de Baleine

**Tous les whale trades**
```
GET /api/data/whale-transactions?limit=50
Response: [
  { tx_hash: "...", mint: "...", amount: 1000000, amount_usd: 50000, timestamp: "..." },
  ...
]
```

**Whale trades pour un token**
```
GET /api/data/token/{mint}/whale-transactions?limit=50
```

**Transactions récentes**
```
GET /api/data/token/{mint}/transactions?limit=100
```

#### Pools de Liquidité

**Top pools**
```
GET /api/data/pools?limit=50
Response: [
  { 
    pool_id: "...",
    pool_name: "SOL/USDC",
    token_a_mint: "...",
    token_b_mint: "...",
    liquidity_usd: 5000000,
    volume_24h: 1000000,
    apy: 45.5
  },
  ...
]
```

**Pools d'un token**
```
GET /api/data/token/{mint}/pools
```

#### Analyse des Holders

**Distribution des holders**
```
GET /api/data/token/{mint}/holders
Response: {
  total_holders: 50000,
  top_10_concentration: 35.5,
  top_100_concentration: 52.3,
  whale_count: 45
}
```

#### Statistiques Globales

**Stats de volume (24h)**
```
GET /api/data/stats/volume?hours=24
Response: {
  total_volume: 1000000000,
  avg_volume: 500000,
  active_tokens: 5000
}
```

**Stats de market cap**
```
GET /api/data/stats/marketcap
Response: {
  total_market_cap: 50000000000,
  avg_market_cap: 10000000,
  tokens_tracked: 5000
}
```

#### Recherche

**Chercher des tokens**
```
GET /api/data/search?query=SOL
Response: [
  { mint: "...", symbol: "SOL", name: "Solana", price: 135.50 },
  ...
]
```

#### Analyse Technique

**Volatilité**
```
GET /api/data/token/{mint}/volatility?days=7
Response: {
  volatility: 45.5,  // pourcentage
  mean: 0.1234,
  std_dev: 0.0056,
  min: 0.1100,
  max: 0.1400
}
```

**Sentiment**
```
GET /api/data/token/{mint}/sentiment
Response: {
  sentiment_score: 75,  // -100 to +100
  sentiment_label: "bullish",
  volume_to_mcap_ratio: 0.05,
  momentum_score: 65
}
```

### Gestion de la Liste de Surveillance

**Ajouter un token à surveiller**
```
POST /api/data/watch
Body: { "tokenMint": "EPjFWaLb3odcccccccccccccccccccccccccccccc" }
```

**Retirer un token**
```
DELETE /api/data/watch/{mint}
```

**Voir la liste**
```
GET /api/watch
```

### Exemples d'Utilisation

#### JavaScript/Node.js

```javascript
// Démarrer la synchronisation
async function startSync() {
  const response = await fetch('http://localhost:3000/api/data/sync/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frequency: 30000 })
  });
  return response.json();
}

// Récupérer le prix actuel
async function getPrice(mint) {
  const response = await fetch(`http://localhost:3000/api/data/token/${mint}/price`);
  const data = await response.json();
  return data.price;
}

// Obtenir les top gainers
async function getTopGainers() {
  const response = await fetch('http://localhost:3000/api/data/gainers?limit=10');
  const data = await response.json();
  return data.gainers;
}

// Whale trades d'un token
async function getWhaleTransactions(mint) {
  const response = await fetch(`http://localhost:3000/api/data/token/${mint}/whale-transactions`);
  const data = await response.json();
  return data.transactions;
}

// Exemple: Alerter sur les whale trades
async function watchForWhales() {
  const whales = await fetch('http://localhost:3000/api/data/whale-transactions');
  const data = await whales.json();
  
  for (const tx of data.transactions) {
    if (tx.amount_usd > 500000) {
      console.log(`🐋 WHALE ALERT: ${tx.amount_usd}$ in ${tx.symbol}`);
    }
  }
}
```

#### Python

```python
import requests
import time

# Configuration
BASE_URL = "http://localhost:3000/api"
BIRDEYE_KEY = "votre_cle_birdeye"

# Démarrer sync
def start_sync():
    response = requests.post(f"{BASE_URL}/data/sync/start", 
                           json={"frequency": 30000})
    return response.json()

# Récupérer les top gainers
def get_gainers(limit=20):
    response = requests.get(f"{BASE_URL}/data/gainers?limit={limit}")
    return response.json()

# Monitoring des whale trades
def monitor_whales():
    while True:
        response = requests.get(f"{BASE_URL}/data/whale-transactions?limit=50")
        data = response.json()
        
        for tx in data['transactions']:
            if tx['amount_usd'] > 1000000:
                print(f"🐋 MEGA WHALE: {tx['amount_usd']:,.0f}$ - {tx['symbol']}")
        
        time.sleep(10)  # Check every 10 seconds

# Exemple: Analyser un token
def analyze_token(mint):
    price = requests.get(f"{BASE_URL}/data/token/{mint}/price").json()
    holders = requests.get(f"{BASE_URL}/data/token/{mint}/holders").json()
    volatility = requests.get(f"{BASE_URL}/data/token/{mint}/volatility?days=7").json()
    
    print(f"Price: ${price['price']['price']}")
    print(f"Holders: {holders['holders']['total_holders']}")
    print(f"Volatility: {volatility['analysis']['volatility']:.2f}%")
    
    return {
        'price': price,
        'holders': holders,
        'volatility': volatility
    }

if __name__ == "__main__":
    # Démarrer
    start_sync()
    
    # Monitorer les balenes
    monitor_whales()
```

### Structure des Données

#### Token Price
```json
{
  "mint": "EPjFWaLb3...",
  "price": 0.1234,
  "price_24h_change": 5.25,
  "market_cap": 123456789,
  "volume_24h": 5000000,
  "holders": 50000,
  "supply": 1000000000,
  "recorded_at": "2024-01-01T00:00:00Z"
}
```

#### Liquidity Pool
```json
{
  "pool_id": "...",
  "pool_name": "SOL/USDC",
  "pool_type": "raydium",
  "token_a_mint": "...",
  "token_b_mint": "...",
  "token_a_symbol": "SOL",
  "token_b_symbol": "USDC",
  "liquidity_usd": 5000000,
  "volume_24h": 1000000,
  "apy": 45.5,
  "fee_tier": 0.25
}
```

#### Whale Transaction
```json
{
  "tx_hash": "...",
  "mint": "...",
  "symbol": "SOL",
  "from_address": "...",
  "to_address": "...",
  "amount": 1000000,
  "amount_usd": 50000,
  "transaction_type": "buy",
  "is_whale_trade": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Configuration Requise

#### API Keys Gratuits (Free Tier)

1. **Birdeye** (https://birdeye.so)
   - 100 requêtes/minute
   - Couvrir pour les prix et holders

2. **Helius** (https://www.helius.xyz)
   - 500 requêtes/jour (gratuit)
   - 500,000/mois avec free tier

3. **Raydium** (Public API)
   - Sans clé
   - Limité à 30 requêtes/minute

### Performance

- **Stockage**: ~100MB par mois (30 jours de data)
- **CPU**: Minimal (~5-10%)
- **Mémoire**: ~50MB
- **Bande passante**: ~500KB/sync

### Nettoyage des Données

Les données de plus de 30 jours sont automatiquement supprimées via:
```sql
SELECT cleanup_old_solana_data();  -- Manuel
```

### Dépannage

**Erreur: "Database connection failed"**
```bash
# Vérifier DATABASE_URL
echo $DATABASE_URL

# Tester la connexion
psql -d $DATABASE_URL -c "SELECT 1"
```

**Erreur: "Birdeye API error"**
```bash
# Vérifier la clé API
echo $BIRDEYE_API_KEY

# Tester l'API
curl -H "X-API-KEY: $BIRDEYE_API_KEY" https://api.birdeye.so/defi/token_overview?address=EPjFWaLb3...
```

**Synchro lente**
- Réduire le nombre de tokens surveillés
- Augmenter l'intervalle de synchro (30s minimum recommandé)
- Vérifier la bande passante Internet

### Limites et Quotas

| Source | Limite | Notes |
|--------|--------|-------|
| Birdeye | 100/min | Gratuit |
| Helius | 500/jour | Gratuit |
| Raydium | 30/min | Sans limite |
| Base de données | Stockage illimité | 30 jours conservés |
| Sync frequency | 30s minimum | Recommandé |

### Évolutions Futures

- [ ] WebSocket pour les mises à jour en temps réel
- [ ] Alertes personnalisées (email, Telegram, Discord)
- [ ] Backtesting avec les données historiques
- [ ] Machine Learning pour les prédictions
- [ ] Support pour d'autres blockchains (Ethereum, Polygon, etc.)
