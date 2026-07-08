/**
 * VIEW: AdminView
 * Responsabilidade: Gerenciamento completo do Painel Administrativo.
 * Inclui: Login, Listagens Dinâmicas, Dashboard (Chart.js), Exclusão e Atualização (CRUD).
 */
class AdminView {
    constructor(controller) {
        this.controller = controller;
        this.chartInstance = null;

        // Elementos de tela existentes
        this.secLogin = document.getElementById('section-login');
        this.secPanel = document.getElementById('section-admin-panel');
        this.formLogin = document.getElementById('form-login');
        this.msgLogin = document.getElementById('msg-login');
        this.formAlerta = document.getElementById('form-alerta');
        this.selectEstado = document.getElementById('estado');
        this.selectCidade = document.getElementById('cidade');
        this.selectSangue = document.getElementById('tipoSanguineo');
        this.containerListaAlertas = document.getElementById('lista-alertas');
        this.containerDoadores = document.getElementById('lista-gerenciar-doadores');
        this.containerPedidos = document.getElementById('lista-gerenciar-pedidos');
    }

    init() {
        if (!this.formLogin) return;
        
        this.formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usuarioInput = document.getElementById('usuario').value;
            const senhaInput = document.getElementById('senha').value;

            if (usuarioInput === 'admin' && senhaInput === '123') {
                this.secLogin.style.display = 'none';
                this.secPanel.style.display = 'flex';
                await this.carregarEstadosIBGE(); // Adicionado await
                await this.renderizarListaAlertas();
                await this.renderizarTabelasDuais();
            } else {
                this.msgLogin.textContent = "Credenciais administrativas incorretas.";
                this.msgLogin.className = "message-box error";
                this.msgLogin.classList.remove('hide');
            }
        });

        this.selectEstado.addEventListener('change', (e) => this.carregarCidadesIBGE(e.target.value));
        
        this.formAlerta.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.controller.adicionarAlertaCritico({
                estado: this.selectEstado.value,
                cidade: this.selectCidade.value,
                tipoSanguineo: this.selectSangue.value
            });
            this.formAlerta.reset();
            if(this.selectCidade) this.selectCidade.disabled = true;
            await this.renderizarListaAlertas();
            await this.renderizarTabelasDuais(); // Atualiza a tabela de chamados também
        });
    }

    /**
     * ATUALIZAR (UPDATE) - Nova função para atender ao requisito do professor
     * Certifique-se de que no seu DoadorController exista a função 'atualizarAlerta(id, dados)'
     */
    async processarAtualizacaoAlerta(id) {
        const novoStatus = prompt("Digite o novo status ou nome da cidade para atualização:");
        if (novoStatus) {
            await this.controller.atualizarAlerta(id, { cidade: novoStatus });
            await this.renderizarListaAlertas();
            await this.renderizarTabelasDuais();
        }
    }

    async renderizarGrafico() {
        const ctx = document.getElementById('graficoSangue');
        if (!ctx) return;

        const doadores = await this.controller.obterListaDoadores();
        const contagem = { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 };

        doadores.forEach(d => {
            if (contagem[d.tipoSanguineo] !== undefined) contagem[d.tipoSanguineo]++;
        });

        if (this.chartInstance) this.chartInstance.destroy();

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(contagem),
                datasets: [{
                    data: Object.values(contagem),
                    backgroundColor: ['#ef4444', '#f87171', '#f97316', '#fb923c', '#06b6d4', '#22c55e', '#3b82f6', '#6366f1'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '65%' }
        });
    }

    async renderizarTabelasDuais() {
        if (!this.containerDoadores || !this.containerPedidos) return;

        const doadores = await this.controller.obterListaDoadores();
        const alertas = await this.controller.obterCidadesCriticas(); // Busca os pedidos/alertas
        
        await this.renderizarGrafico();

        // RENDERIZAÇÃO DA TABELA DE DOADORES
        this.containerDoadores.innerHTML = `
            <table class="mural-table">
                <thead><tr><th>Nome</th><th>Sangue</th><th>Localidade</th><th>Ações</th></tr></thead>
                <tbody>${doadores.map(d => `
                    <tr>
                        <td>${d.nome}</td>
                        <td><span class="blood-badge">${d.tipoSanguineo}</span></td>
                        <td>${d.cidade}/${d.estado}</td>
                        <td><button class="btn-del-d" data-id="${d.id}" style="background:#e11d48; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Excluir</button></td>
                    </tr>
                `).join('')}
                ${doadores.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Nenhum doador registrado.</td></tr>' : ''}
                </tbody>
            </table>`;

        this.containerDoadores.querySelectorAll('.btn-del-d').forEach(b => {
            b.addEventListener('click', async (e) => {
                if (confirm("Remover doador?")) {
                    await this.controller.excluirDoador(e.target.getAttribute('data-id'));
                    await this.renderizarTabelasDuais(); // Atualiza tudo
                }
            });
        });

        // RENDERIZAÇÃO DA TABELA DE PEDIDOS/CHAMADOS
        this.containerPedidos.innerHTML = `
            <table class="mural-table">
                <thead><tr><th>Localidade (Cidade/UF)</th><th>Grupo Solicitado</th></tr></thead>
                <tbody>${alertas.map(a => `
                    <tr>
                        <td>${a.cidade}/${a.estado}</td>
                        <td><span class="blood-badge">${a.tipoSanguineo}</span></td>
                    </tr>
                `).join('')}
                ${alertas.length === 0 ? '<tr><td colspan="2" style="text-align:center;">Nenhum chamado emergencial no momento.</td></tr>' : ''}
                </tbody>
            </table>`;
    }

    async renderizarListaAlertas() {
        if (!this.containerListaAlertas) return;

        const alertas = await this.controller.obterCidadesCriticas();
        this.containerListaAlertas.innerHTML = alertas.map(a => `
            <div style="padding:10px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <span>📍 <strong>${a.cidade}/${a.estado}</strong> - Precisa de <span class="blood-badge">${a.tipoSanguineo}</span></span>
                <div>
                    <button class="btn-edit-a" data-id="${a.id}" style="background:#f59e0b; color:white; border:none; padding:4px 8px; margin-left:10px; cursor:pointer; border-radius:4px;">Editar</button>
                    <button class="btn-del-a" data-id="${a.id}" style="background:#ef4444; color:white; border:none; padding:4px 8px; cursor:pointer; border-radius:4px;">Excluir</button>
                </div>
            </div>
        `).join('');

        // Listener para Editar
        this.containerListaAlertas.querySelectorAll('.btn-edit-a').forEach(b => {
            b.addEventListener('click', (e) => this.processarAtualizacaoAlerta(e.target.getAttribute('data-id')));
        });

        // Listener para Excluir
        this.containerListaAlertas.querySelectorAll('.btn-del-a').forEach(b => {
            b.addEventListener('click', async (e) => {
                if (confirm("Encerrar este alerta crítico?")) {
                    await this.controller.excluirAlertaCritico(e.target.getAttribute('data-id'));
                    await this.renderizarListaAlertas();
                    await this.renderizarTabelasDuais();
                }
            });
        });
    }

    // Métodos IBGE Restaurados para o funcionamento correto do Formulário
    async carregarEstadosIBGE() {
        try {
            const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
            const estados = await response.json();
            this.selectEstado.innerHTML = '<option value="">Selecione o Estado</option>';
            
            estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.sigla;
                option.textContent = estado.nome;
                this.selectEstado.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar estados do IBGE:", error);
            this.selectEstado.innerHTML = '<option value="">Erro ao carregar estados</option>';
        }
    }

    async carregarCidadesIBGE(siglaUF) {
        if (!siglaUF) {
            this.selectCidade.innerHTML = '<option value="">Selecione um estado primeiro</option>';
            this.selectCidade.disabled = true;
            return;
        }

        try {
            this.selectCidade.innerHTML = '<option value="">Carregando cidades...</option>';
            this.selectCidade.disabled = true;

            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaUF}/municipios?orderBy=nome`);
            const cidades = await response.json();

            this.selectCidade.innerHTML = '<option value="">Selecione a Cidade</option>';
            cidades.forEach(cidade => {
                const option = document.createElement('option');
                option.value = cidade.nome;
                option.textContent = cidade.nome;
                this.selectCidade.appendChild(option);
            });

            this.selectCidade.disabled = false;
        } catch (error) {
            console.error("Erro ao carregar cidades do IBGE:", error);
            this.selectCidade.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        }
    }
}

window.AdminView = AdminView;