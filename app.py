import os
import requests
from flask import Flask, render_template

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'valor-padrao')

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/api/dashboard')
def api_dashboard():
    try:
        response = requests.get("https://n8n-n8n-start.gwlcya.easypanel.host/webhook/dashboard", timeout=12)
        data = response.json()
        return {
            "clientes_sem_sinal": data.get("clientes_sem_sinal", 0),
            "os_em_atraso": data.get("os_em_atraso", 0),
            "top5_disparos": data.get("top5_disparos", []),
            "percentual_atualizacao": data.get("percentual_atualizacao", "0%")
        }
    except Exception as e:
        return {
            "clientes_sem_sinal": "Erro",
            "os_em_atraso": "Erro",
            "top5_disparos": ["Erro ao buscar dados"],
            "percentual_atualizacao": "Erro"
        }

if __name__ == "__main__":
    app.run(debug=False)
