const axios = require('axios');
const { parse } = require('json2csv');
const fs = require('fs');

// Endpoints de CoinPaprika
const tickersUrl = 'https://api.coinpaprika.com/v1/tickers';
const globalUrl = 'https://api.coinpaprika.com/v1/global';

async function fetchAndSaveData() {
  try {
    // 1. Obtener datos de criptomonedas (Tickers)
    const tickersResponse = await axios.get(tickersUrl);
    const allTickers = tickersResponse.data;
    
    // Filtrar los 100 primeros (normalmente los de mayor ranking)
    const top100Tickers = allTickers.slice(0, 100);
    
    // Mapear los campos esenciales de cada criptomoneda
    const filteredCurrentData = top100Tickers.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      rank: coin.rank,
      max_supply: coin.max_supply ? String(coin.max_supply) : null, // Evita notación científica
      total_supply: coin.total_supply ? String(coin.total_supply) : null,
      beta_value: coin.beta_value.toFixed(0),
      market_cap: String(coin.quotes.USD.market_cap), // Números grandes como string
      price_change_24h: coin.quotes.USD.percent_change_24h.toFixed(2),
      current_price: coin.quotes.USD.price.toFixed(2)
    }));
    
    // Convertir los datos de criptomonedas a CSV
    const csvCoins = parse(filteredCurrentData, {
      fields: [
        'id', 'name', 'symbol','rank',
        'max_supply', 'total_supply','beta_value',
        'market_cap', 'price_change_24h','current_price'
      ]
    });
    
    // Guardar el archivo CSV para las criptomonedas
    fs.writeFileSync('crypto_data_coinpaprika.csv', csvCoins);
    console.log('Archivo crypto_data_coinpaprika.csv generado correctamente!');
    
    // 2. Obtener datos globales
    const globalResponse = await axios.get(globalUrl);
    const globalData = globalResponse.data;
      
    // Convertir números grandes a string y formatear decimales
    const formattedGlobalData = {
      market_cap_usd: String(globalData.market_cap_usd),
      volume_24h_usd: String(globalData.volume_24h_usd),
      bitcoin_dominance_percentage: globalData.bitcoin_dominance_percentage.toFixed(2),
      cryptocurrencies_number: globalData.cryptocurrencies_number,
      market_cap_ath_value: String(globalData.market_cap_ath_value),
      market_cap_ath_date: globalData.market_cap_ath_date,
      volume_24h_ath_value: String(globalData.volume_24h_ath_value),
      volume_24h_ath_date: globalData.volume_24h_ath_date,
      market_cap_change_24h: globalData.market_cap_change_24h.toFixed(4),
      volume_24h_change_24h: globalData.volume_24h_change_24h.toFixed(4),
      last_updated: globalData.last_updated
};

      const globalDataArray = [formattedGlobalData];

      // Convertir los datos globales a CSV
      const csvGlobal = parse(globalDataArray, {
        fields: [
          'market_cap_usd',
          'volume_24h_usd',
          'bitcoin_dominance_percentage',
          'cryptocurrencies_number',
          'market_cap_ath_value',
          'market_cap_ath_date',
          'volume_24h_ath_value',
          'volume_24h_ath_date',
          'market_cap_change_24h',
          'volume_24h_change_24h',
          'last_updated'
        ]
      });
          
          // Guardar el archivo CSV para los datos globales
          fs.writeFileSync('global_data_coinpaprika.csv', csvGlobal);
          console.log('Archivo global_data_coinpaprika.csv generado correctamente!');
          
  } catch (error) {
    console.error('Error al obtener los datos:', error.message);
  }
}

fetchAndSaveData();
