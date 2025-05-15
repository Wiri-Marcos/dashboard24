import os
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'valor-padrao')

# Variável global para armazenar os dados recebidos
DADOS_DASHBOARD = {
    "clientes_sem_sinal": 0,
    "os_em_atraso": 0,
    "top5_disparos": [],
    "percentual_atualizacao": "0%"
}

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    return jsonify(DADOS_DASHBOARD)

@app.route('/api/dashboard', methods=['POST'])
def atualizar_dashboard():
    global DADOS_DASHBOARD
    data = request.get_json()
    if data:
        DADOS_DASHBOARD.update(data)
        return jsonify({"status": "ok", "mensagem": "Indicadores atualizados com sucesso."})
    return jsonify({"status": "erro", "mensagem": "Dados inválidos."}), 400

if __name__ == "__main__":
    app.run(debug=False)
