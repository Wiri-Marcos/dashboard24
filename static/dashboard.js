// dashboard.js - lógica principal do dashboard

async function atualizarDashboard() {
  try {
    const response = await fetch("https://n8n-n8n-start.gwlcya.easypanel.host/webhook/dashboard", {
      method: "GET",
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Erro na resposta do webhook');
    const data = await response.json();
    document.getElementById("clientes_sem_sinal").textContent = data.clientes_sem_sinal;
    document.getElementById("os_em_atraso").textContent = data.os_em_atraso;
    document.getElementById("os_concluidas").textContent = data.os_concluidas !== undefined ? data.os_concluidas : 0;
    document.getElementById("percentual_atualizacao").textContent = data.percentual_atualizacao;
    let perc = 0;
    if (typeof data.percentual_atualizacao === 'string' && data.percentual_atualizacao.includes('%')) {
      perc = parseInt(data.percentual_atualizacao);
    } else if (!isNaN(data.percentual_atualizacao)) {
      perc = data.percentual_atualizacao;
    }
    document.getElementById("progress-bar").style.width = perc + "%";
    // Atualiza listas de top 5
    function atualizarLista(id, lista) {
      const ul = document.getElementById(id);
      ul.innerHTML = '';
      if (Array.isArray(lista)) {
        lista.slice(0, 5).forEach((item, idx) => {
          const li = document.createElement('li');
          li.textContent = `${idx + 1}. ${item}`;
          ul.appendChild(li);
        });
      }
    }
    atualizarLista("top_disparos", data.clientes_mais_disparos);
    atualizarLista("top_deslocamentos", data.clientes_mais_deslocamentos);
    atualizarLista("top_violados", data.clientes_mais_violados);
  } catch (e) {
    console.error('Erro ao atualizar dashboard:', e);
    setTimeout(atualizarDashboard, 3000);
    return;
  }
  atualizarDashboard();
}
atualizarDashboard();

// Expansão do card de OS Atrasadas
const expandBtn = document.getElementById('expand-btn-os');
const cardOs = document.getElementById('card_os_atrasadas');
const tecnicosLista = document.getElementById('tecnicos-lista');
let tecnicosAtivo = false;
let tecnicosAbortController = null;

expandBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cardOs.classList.toggle('card-expand');
  tecnicosLista.classList.toggle('active');
  expandBtn.classList.toggle('expanded');
  tecnicosAtivo = tecnicosLista.classList.contains('active');
  if (tecnicosAtivo) {
    carregarTecnicosPendentes();
  } else {
    if (tecnicosAbortController) {
      tecnicosAbortController.abort();
    }
  }
});

async function carregarTecnicosPendentes() {
  if (!tecnicosAtivo) return;
  try {
    tecnicosAbortController = new AbortController();
    const response = await fetch('/api/tecnicos_os_pendentes', { signal: tecnicosAbortController.signal });
    if (!response.ok) throw new Error('Erro ao buscar técnicos');
    const data = await response.json();
    const ul = document.getElementById('lista_tecnicos');
    ul.innerHTML = '';
    // Garante que data é um array de objetos com nome e pendentes
    if (Array.isArray(data) && data.length > 0 && data[0].nome !== undefined && data[0].pendentes !== undefined) {
      data.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="nome-tecnico">${item.nome}</span><span class="numero-os">${item.pendentes}</span>`;
        li.style.cursor = 'pointer';
        li.addEventListener('click', function() {
          // Mostra loading no overlay enquanto espera
          mostrarOverlayOS(item.nome, [], true);
          fetch('/api/os_tecnico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: item.nome })
          })
          .then(resp => {
            if (!resp.ok) throw new Error('Erro ao buscar OSs do técnico');
            return resp.json();
          })
          .then(json => {
            // Garante que sempre será um array
            let listaOS = [];
            if (Array.isArray(json)) {
              listaOS = json;
            } else if (json && typeof json === 'object' && Object.keys(json).length > 0) {
              listaOS = [json];
            }
            if (listaOS.length > 0) {
              mostrarOverlayOS(item.nome, listaOS);
            } else if (json.erro) {
              mostrarOverlayOS(item.nome, []);
              const overlay = document.getElementById('overlay-os');
              overlay.querySelector('.os-container').innerHTML = `<div style=\"color:#ff5c5c;font-size:1.2em\">${json.erro}</div>`;
            } else {
              mostrarOverlayOS(item.nome, []);
              const overlay = document.getElementById('overlay-os');
              overlay.querySelector('.os-container').innerHTML = '<div style="color:#ff5c5c;font-size:1.2em">Nenhuma OS encontrada para este técnico.</div>';
            }
          })
          .catch(() => {
            mostrarOverlayOS(item.nome, []);
            const overlay = document.getElementById('overlay-os');
            overlay.querySelector('.os-container').innerHTML = '<div style="color:#ff5c5c;font-size:1.2em">Erro ao buscar OSs do técnico.</div>';
          });
        });
        ul.appendChild(li);
      });
    } else {
      ul.innerHTML = '<li>Nenhum técnico encontrado</li>';
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      document.getElementById('lista_tecnicos').innerHTML = '<li>Erro ao carregar técnicos</li>';
    }
  }
}

// Função para criar overlay de OSs do técnico
// Adiciona parâmetro opcional para mostrar loading
function mostrarOverlayOS(nomeTecnico, listaOS, loading) {
  // Remove overlay anterior se existir
  const old = document.getElementById('overlay-os');
  if (old) old.remove();
  // Cria overlay
  const overlay = document.createElement('div');
  overlay.className = 'overlay-os';
  overlay.id = 'overlay-os';
  overlay.innerHTML = `
    <button class='close-btn' title='Fechar'>&times;</button>
    <h2>OSs do Técnico: <span style='color:#22d3ee'>${nomeTecnico}</span></h2>
    <div class='os-container'></div>
  `;
  document.body.appendChild(overlay);
  // Botão de fechar
  overlay.querySelector('.close-btn').onclick = () => overlay.remove();
  // Preenche as OSs
  const container = overlay.querySelector('.os-container');
  if (loading) {
    container.innerHTML = '<div style="color:#22d3ee;font-size:1.2em">Carregando OSs...</div>';
    return;
  }
  if (!listaOS || listaOS.length === 0) return;
  listaOS.forEach(os => {
    const card = document.createElement('div');
    card.className = 'os-card';
    card.innerHTML = `
      <h3>Cliente Nº: ${os.Cliente}</h3>
      <div class='campo'><strong>Data de Abertura:</strong> ${String(os.DataAbertura).replace(/\"/g, '').replace('T', ' ').replace('.000Z','')}</div>
      <div class='campo'><strong>Técnico:</strong> ${os.Técnico}</div>
      <div class='campo obs'><strong>Observação:</strong><br>${os.Observações}</div>
    `;
    container.appendChild(card);
  });
}
