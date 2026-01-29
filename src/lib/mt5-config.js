/**
 * MT5 Broker Configuration Module
 * Manages broker-specific settings and API endpoints
 */

export const BROKER_CONFIGS = {
  ICMarkets: {
    name: 'IC Markets',
    apiUrl: 'https://trade.icmarkets.com:443/api',
    wsUrl: 'wss://trade.icmarkets.com:443',
    supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'XAUUSD'],
    minVolume: 0.01,
    maxVolume: 100,
    defaultLeverage: 500,
    maxLeverage: 500,
    requiredMarginPercentage: 0.2,
    spreadType: 'variable',
    features: ['copyTrading', 'signals', 'autoTrading', 'martingale'],
  },
  Exness: {
    name: 'Exness',
    apiUrl: 'https://openapi.exness.com/OpenAPI/v2',
    wsUrl: 'wss://openapi.exness.com/OpenAPI/v2',
    supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'XAUUSD', 'XAGUSD'],
    minVolume: 0.01,
    maxVolume: 200,
    defaultLeverage: 1000,
    maxLeverage: 1000,
    requiredMarginPercentage: 0.1,
    spreadType: 'variable',
    features: ['copyTrading', 'signals', 'autoTrading', 'socialTrading'],
  },
  Pepperstone: {
    name: 'Pepperstone',
    apiUrl: 'https://restapi.pepperstone.com/v1',
    wsUrl: 'wss://restapi.pepperstone.com/v1',
    supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'XAUUSD', 'XAGUSD', 'BTCUSD'],
    minVolume: 0.01,
    maxVolume: 100,
    defaultLeverage: 500,
    maxLeverage: 500,
    requiredMarginPercentage: 0.2,
    spreadType: 'fixed',
    features: ['copyTrading', 'signals', 'autoTrading'],
  },
  FxPro: {
    name: 'FxPro',
    apiUrl: 'https://api.fxpro.com/v1',
    wsUrl: 'wss://api.fxpro.com/v1',
    supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'XAUUSD'],
    minVolume: 0.01,
    maxVolume: 100,
    defaultLeverage: 500,
    maxLeverage: 500,
    requiredMarginPercentage: 0.2,
    spreadType: 'variable',
    features: ['copyTrading', 'signals', 'autoTrading'],
  },
};

/**
 * Get broker config
 */
export function getBrokerConfig(brokerName) {
  return BROKER_CONFIGS[brokerName] || null;
}

export default BROKER_CONFIGS;

/**
 * Validate symbol support for broker
 */
export function isSymbolSupported(brokerName, symbol) {
  const config = getBrokerConfig(brokerName);
  return config && config.supportedSymbols.includes(symbol.toUpperCase());
}

/**
 * Validate volume for broker
 */
export function isVolumeLegal(brokerName, volume) {
  const config = getBrokerConfig(brokerName);
  if (!config) return false;
  return volume >= config.minVolume && volume <= config.maxVolume;
}

/**
 * Get list of all brokers
 */
export function listBrokers() {
  return Object.keys(BROKER_CONFIGS).map(key => ({
    name: key,
    displayName: BROKER_CONFIGS[key].name,
    features: BROKER_CONFIGS[key].features,
  }));
}

/**
 * Calculate required margin
 */
export function calculateRequiredMargin(brokerName, symbol, volume, price, leverage = null) {
  const config = getBrokerConfig(brokerName);
  if (!config) throw new Error('Broker not found');

  const effectiveLeverage = leverage || config.defaultLeverage;
  const marginRequired = (volume * price) / effectiveLeverage;
  
  return {
    marginRequired,
    baseCurrency: 'USD',
    leverage: effectiveLeverage,
  };
}

/**
 * Validate trade parameters
 */
export function validateTradeParameters(brokerName, tradeParams) {
  const config = getBrokerConfig(brokerName);
  if (!config) {
    return { valid: false, errors: ['Broker not found'] };
  }

  const errors = [];

  if (!isSymbolSupported(brokerName, tradeParams.symbol)) {
    errors.push(`Symbol ${tradeParams.symbol} not supported`);
  }

  if (!isVolumeLegal(brokerName, tradeParams.volume)) {
    errors.push(`Volume must be between ${config.minVolume} and ${config.maxVolume}`);
  }

  if (tradeParams.leverage && tradeParams.leverage > config.maxLeverage) {
    errors.push(`Leverage cannot exceed ${config.maxLeverage}`);
  }

  if (tradeParams.stopLoss && tradeParams.takeProfit) {
    if (tradeParams.orderType === 'buy' && tradeParams.stopLoss >= tradeParams.takeProfit) {
      errors.push('Stop loss must be below take profit for buy orders');
    }
    if (tradeParams.orderType === 'sell' && tradeParams.stopLoss <= tradeParams.takeProfit) {
      errors.push('Stop loss must be above take profit for sell orders');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available trading hours (broker specific)
 */
export function getTradingHours(brokerName, symbol) {
  // Default forex trading hours (UTC)
  const defaultHours = {
    EURUSD: { open: '22:00', close: '20:00', timezone: 'UTC', days: 'Mon-Fri' },
    GBPUSD: { open: '22:00', close: '20:00', timezone: 'UTC', days: 'Mon-Fri' },
    USDJPY: { open: '22:00', close: '20:00', timezone: 'UTC', days: 'Mon-Fri' },
    XAUUSD: { open: '00:00', close: '23:59', timezone: 'UTC', days: 'Mon-Fri' },
  };

  return defaultHours[symbol.toUpperCase()] || { open: '00:00', close: '23:59', timezone: 'UTC' };
}

export default BROKER_CONFIGS;
