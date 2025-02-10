require('dotenv').config();
const axios = require('axios');
const { parse } = require('json2csv');
const fs = require('fs');
const API_KEY = process.env.API_KEY;

// Lista de las empresas más grandes del S&P 100
const SYMBOLS = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META',  // Tecnología
    'TSLA', 'NVDA', 'ADBE', 'CRM', 'INTC',   // Tecnología
    'ORCL', 'CSCO', 'IBM', 'QCOM', 'TXN',    // Tecnología
    'JNJ', 'PFE', 'MRK', 'ABT', 'GILD',      // Salud
    'WMT', 'TGT', 'COST', 'HD', 'LOW',       // Retail
    'JPM', 'BAC', 'WFC', 'C', 'GS',          // Finanzas
    'V', 'MA', 'PYPL', 'AXP', 'DIS',         // Finanzas/Entretenimiento
    'NFLX', 'CMCSA', 'T', 'VZ', 'PEP',       // Telecom/Consumo
    'KO', 'PG', 'UNH', 'CVX', 'XOM',         // Energía/Consumo
    'BA', 'CAT', 'MMM', 'HON', 'GE',         // Industrial
    'NKE', 'MCD', 'SBUX', 'PM', 'MO'         // Consumo
  ];
const API_DELAY = 12000; // 13 segundos entre llamadas

// Función para obtener datos de Overview API
async function getCompanyOverview(symbol) {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error(`Error en OVERVIEW para ${symbol}:`, error.message);
    return null;
  }
}

// Función para obtener datos de Earnings API
async function getEarnings(symbol) {
  const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${API_KEY}`;
  try {
    const { data } = await axios.get(url);
    return data?.annualEarnings || [];
  } catch (error) {
    console.error(`Error en EARNINGS para ${symbol}:`, error.message);
    return [];
  }
}

async function main() {
  let companiesData = [];
  let earningsData = [];

  for (const [index, symbol] of SYMBOLS.entries()) {
    console.log(`Procesando ${symbol} (${index + 1}/${SYMBOLS.length})...`);
    
    // Obtener datos de Overview
    const overview = await getCompanyOverview(symbol);
    if (!overview) continue;

    // Obtener datos de Earnings
    const earnings = await getEarnings(symbol);
    
    // 1. Datos para el CSV de empresas
    companiesData.push({
      Symbol: overview.Symbol,
      Name: overview.Name,
      Sector: overview.Sector,
      Industry: overview.Industry,
      MarketCap: overview.MarketCapitalization,
      EPS: overview.EPS,
      RevenueTTM: overview.RevenueTTM,
      Beta: overview.Beta,
      DividendYield: overview.DividendYield
    });

    // 2. Datos para el CSV de EPS histórico
    earnings.forEach(entry => {
      earningsData.push({
        Symbol: overview.Symbol,
        Company: overview.Name,
        FiscalDateEnding: entry.fiscalDateEnding,
        ReportedEPS: entry.reportedEPS
      });
    });

    // Respeta el límite de la API
    if (index < SYMBOLS.length - 1) await new Promise(resolve => setTimeout(resolve, API_DELAY));
  }

  // Generar archivos CSV
  try {
    // CSV 1: Datos generales de empresas
    if (companiesData.length === 0) {
        console.error("No hay datos de empresas para generar CSV");
      } else {
        const companiesCsv = parse(companiesData);
        fs.writeFileSync('companies_summary.csv', companiesCsv);
      }

    // CSV 2: Datos históricos de EPS
    const earningsCsv = parse(earningsData);
    fs.writeFileSync('historical_eps.csv', earningsCsv);

    console.log('✅ Archivos generados: companies_summary.csv y historical_eps.csv');
  } catch (err) {
    console.error('Error al generar CSVs:', err);
  }
}

main();