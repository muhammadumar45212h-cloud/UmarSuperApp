import os
import time
import threading
from flask import Flask, jsonify, render_template_string
import requests

app = Flask(__name__)

# لائیو فاریکس ڈیٹا اسٹوریج (Global Memory)
forex_data = {
    "EURUSD": 1.0920,
    "GBPUSD": 1.2740,
    "USDJPY": 155.50,
    "USDPKR": 278.50,
    "status": "Initializing..."
}

def fetch_forex_rates():
    """بیک گراؤنڈ پروسیس جو لائیو فاریکس مارکیٹ کا ڈیٹا بغیر تاخیر کے اپڈیٹ کرتا ہے"""
    global forex_data
    while True:
        try:
            # سیکیور فنانشل مارکیٹ API کال
            response = requests.get("https://er-api.com", timeout=5)
            if response.status_code == 200:
                rates = response.json().get("rates", {})
                forex_data["USDPKR"] = round(rates.get("PKR", 278.50), 2)
                forex_data["EURUSD"] = round(1 / rates.get("EUR", 0.91), 4)
                forex_data["GBPUSD"] = round(1 / rates.get("GBP", 0.78), 4)
                forex_data["USDJPY"] = round(rates.get("JPY", 155.50), 2)
                forex_data["status"] = "Live (Updated)"
        except Exception as e:
            forex_data["status"] = f"Error updating: {str(e)}"
        time.sleep(10)  # سرور پر ڈیٹا ہر 10 سیکنڈ بعد آٹو ریفریش ہوگا

# یوٹیوب اسٹائل ڈارک تھیم لے آؤٹ (HTML + CSS UI)
YOUTUBE_STYLE_UI = """
<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All-In-One Super App Dashboard</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, sans-serif; }
        body { background-color: #0f0f0f; color: #f1f1f1; padding: 20px; }
        header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #3f3f3f; margin-bottom: 30px; }
        h1 { color: #ff0000; font-size: 26px; display: flex; align-items: center; gap: 10px; }
        .badge { background: #ff0000; padding: 5px 10px; font-size: 12px; border-radius: 6px; color: #fff; font-weight: bold; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .card { background-color: #1f1f1f; border-radius: 12px; overflow: hidden; border: 1px solid #2f2f2f; transition: transform 0.2s; }
        .card:hover { transform: scale(1.02); cursor: pointer; border-color: #ff0000; }
        .card-banner { height: 140px; background: linear-gradient(135deg, #ff0000, #000000); display: flex; align-items: center; justify-content: center; font-size: 40px; }
        .card-content { padding: 15px; }
        .card-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #fff; }
        .forex-price { font-size: 24px; color: #2ecc71; font-weight: bold; margin-top: 5px; }
        .status-bar { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <header>
        <h1>🚀 SuperApp Pro</h1>
        <div class="badge">Hacker Mode & Live Forex Active</div>
    </header>
    
    <div class="grid">
        <div class="card">
            <div class="card-banner">🇵🇰</div>
            <div class="card-content">
                <div class="card-title">USD to PKR Rate</div>
                <div class="forex-price">Rs. {{ data.USDPKR }}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-banner">🇪🇺</div>
            <div class="card-content">
                <div class="card-title">EUR / USD</div>
                <div class="forex-price">${{ data.EURUSD }}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-banner">🇬🇧</div>
            <div class="card-content">
                <div class="card-title">GBP / USD</div>
                <div class="forex-price">${{ data.GBPUSD }}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-banner">🛠️</div>
            <div class="card-content">
                <div class="card-title">All-In-One Features</div>
                <p style="color:#aaa; font-size:14px;">Forex, Tools, and Automation modules integrated inside one secure core.</p>
            </div>
        </div>
    </div>
    <div class="status-bar">Forex Engine: {{ data.status }} | System Security: Stable</div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(YOUTUBE_STYLE_UI, data=forex_data)

@app.route('/api/forex')
def get_forex_api():
    return jsonify(forex_data)

if __name__ == '__main__':
    # فاریکس بیک گراؤنڈ پروسیس شروع کریں
    threading.Thread(target=fetch_forex_rates, daemon=True).start()
    # لوکل ہوسٹ سرور پورٹ 5000 پر رن کریں
    app.run(host='0.0.0.0', port=5000, debug=True)
