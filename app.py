import os
from flask import Flask, render_template

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'valor-padrao')

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/api/dashboard')
def api_dashboard():
    # Exemplo de resposta mockada, substitua pelo consumo real do n8n se necessário
    return {
        "clientes_sem_sinal": 5,
        "os_em_atraso": 904,
        "top5_disparos": ["Cliente A", "Cliente B", "Cliente C", "Cliente D", "Cliente E"],
        "percentual_atualizacao": "15%"
    }

if __name__ == "__main__":
    app.run(debug=False)
