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

# Novo endpoint para lista de técnicos e OSs pendentes
@app.route('/api/tecnicos_os_pendentes', methods=['GET'])
def tecnicos_os_pendentes():
    webhook_url = os.environ.get('WEBHOOK_TECNICOS', 'https://n8n-n8n-start.gwlcya.easypanel.host/webhook/tecnicos_os_pendentes')
    try:
        response = requests.get(webhook_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        # Novo formato: [{'Tecnico': 'Nome', 'QuantidadeOS': 9}, ...]
        if isinstance(data, list) and data and 'Tecnico' in data[0] and 'QuantidadeOS' in data[0]:
            lista = [{
                'nome': t.get('Tecnico', ''),
                'pendentes': t.get('QuantidadeOS', 0)
            } for t in data]
            return jsonify(lista)
        # Formato antigo: [{'nome': 'Nome', 'pendentes': 9}, ...]
        if isinstance(data, list) and data and isinstance(data[0], dict) and 'nome' in data[0] and 'pendentes' in data[0]:
            return jsonify(data)
        # Caso venha no formato antigo (array com 'resultado')
        if isinstance(data, list) and data and 'resultado' in data[0]:
            tecnicos = data[0]['resultado']
            lista = [{
                'nome': t.get('nome', ''),
                'pendentes': t.get('pendentes', 0)
            } for t in tecnicos]
            return jsonify(lista)
        return jsonify([])
    except Exception as e:
        return jsonify([]), 500

@app.route('/api/os_tecnico', methods=['POST'])
def api_os_tecnico():
    data = request.get_json()
    if not data or 'nome' not in data:
        return jsonify({'erro': 'Nome do técnico não informado.'}), 400
    # Faz a requisição ao webhook do n8n
    webhook_url = 'https://n8n-n8n-start.gwlcya.easypanel.host/webhook/cosulta-técnico'
    try:
        resp = requests.post(webhook_url, json={'nome': data['nome']}, timeout=15)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'erro': 'Erro ao consultar OSs do técnico.'}), 500

if __name__ == "__main__":
    app.run(debug=False)
