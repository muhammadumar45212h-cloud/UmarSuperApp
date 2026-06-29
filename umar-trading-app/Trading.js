import React, { useEffect } from 'react';

const TradingWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "OANDA:XAUUSD", "title": "Gold" },
        { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" }
      ],
      "colorTheme": "dark",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "en"
    });
    document.getElementById('tradingview-container').appendChild(script);
  }, []);

  return <div id="tradingview-container"></div>;
};
export default TradingWidget;

