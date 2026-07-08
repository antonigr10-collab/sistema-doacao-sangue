class PainelView {
    constructor(controller) {
        this.controller = controller;
        
        // Elementos de Exibição
        this.containerPerfil = document.getElementById('perfil-doador');
        this.containerCompatibilidade = document.getElementById('card-compatibilidade');
        
        // Elementos do CRUD (Edição)
        this.btnAlternarEdicao = document.getElementById('btn-alternar-edicao');
        this.btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');
        this.cardEditarCadastro = document.getElementById('card-editar-cadastro');
        this.formEditarPerfil = document.getElementById('form-editar-perfil');
        
        // Campos do Formulário
        this.editNome = document.getElementById('edit-nome');
        this.editTelefone = document.getElementById('edit-telefone');
        this.editEstado = document.getElementById('edit-estado');
        this.editCidade = document.getElementById('edit-cidade');
        
        // Modal de Urgência
        this.modalOverlay = document.getElementById('urgencia-modal-overlay');
        this.modalTitulo = document.getElementById('urgencia-modal-titulo');
        this.modalTexto = document.getElementById('urgencia-modal-texto');
        this.modalBotao = document.getElementById('urgencia-modal-btn');

        this.usuarioLogado = null;
    }

    async init() {
        const sessao = sessionStorage.getItem('usuario_logado');
        if (!sessao) {
            alert('Acesso restrito. Faça login.');
            window.location.href = 'login.html';
            return;
        }

        const usuarioSessao = JSON.parse(sessao);
        
        try {
            // Busca o usuário atualizado no banco
            this.usuarioLogado = await this.controller.buscarPorId(usuarioSessao.id);

            if (!this.usuarioLogado) {
                alert('Erro ao carregar perfil.');
                window.location.href = 'login.html';
                return;
            }

            // Renderiza as telas
            this.renderizarPerfilDoVoluntario();
            this.renderizarMatrizCompatibilidade(this.usuarioLogado.tipoSanguineo);
            
            // Ativa os cliques e formulários
            this.configurarEventos();
            this.carregarEstadosIBGE();

            // Checa se há alertas urgentes na cidade dele
            await this.checarNotificacoesUrgenciaRegional();

        } catch (erro) {
            console.error("Erro no painel:", erro);
        }
    }

    configurarEventos() {
        // Toggle de Edição
        this.btnAlternarEdicao.addEventListener('click', () => {
            this.cardEditarCadastro.style.display = 'block';
            this.preencherFormularioEdicao();
        });

        this.btnCancelarEdicao.addEventListener('click', () => {
            this.cardEditarCadastro.style.display = 'none';
        });

        // Salvar Edição (Update)
        this.formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dadosAtualizados = {
                nome: this.editNome.value,
                telefone: this.editTelefone.value,
                estado: this.editEstado.value,
                cidade: this.editCidade.value
            };

            const resultado = await this.controller.atualizarPerfil(this.usuarioLogado.id, dadosAtualizados);
            if (resultado.sucesso) {
                alert('Perfil atualizado com sucesso!');
                this.cardEditarCadastro.style.display = 'none';
                this.usuarioLogado = resultado.dados; // Atualiza na memória
                this.renderizarPerfilDoVoluntario(); // Atualiza na tela
            } else {
                alert('Erro ao atualizar: ' + resultado.erro);
            }
        });

        // Eventos de IBGE
        this.editEstado.addEventListener('change', (e) => {
            this.carregarCidadesIBGE(e.target.value);
        });

        // Modal de Urgência
        if (this.modalBotao) {
            this.modalBotao.addEventListener('click', () => this.modalOverlay.classList.remove('active'));
        }
    }

    preencherFormularioEdicao() {
        this.editNome.value = this.usuarioLogado.nome;
        this.editTelefone.value = this.usuarioLogado.telefone;
        // O estado e cidade serão preenchidos após o load da API do IBGE
    }

    renderizarPerfilDoVoluntario() {
        this.containerPerfil.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; line-height: 1.6;">
                <div>
                    <span style="color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Nome Completo</span>
                    <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 2px;">${this.usuarioLogado.nome}</div>
                </div>
                <div>
                    <span style="color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Tipo Sanguíneo</span>
                    <div style="margin-top: 4px;"><span class="blood-badge">${this.usuarioLogado.tipoSanguineo}</span></div>
                </div>
                <div>
                    <span style="color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Telefone</span>
                    <div style="font-size: 15px; color: #334155; margin-top: 2px;">${this.usuarioLogado.telefone || 'Não informado'}</div>
                </div>
                <div>
                    <span style="color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Localidade Atual</span>
                    <div style="font-size: 15px; color: #334155; margin-top: 2px;">📍 ${this.usuarioLogado.cidade} / ${this.usuarioLogado.estado}</div>
                </div>
            </div>
        `;
    }

    renderizarMatrizCompatibilidade(tipo) {
        const rules = {
            'O-': { doar: ['Todos'], receber: ['O-'] },
            'O+': { doar: ['O+', 'A+', 'B+', 'AB+'], receber: ['O+', 'O-'] },
            'A-': { doar: ['A+', 'A-', 'AB+', 'AB-'], receber: ['A-', 'O-'] },
            'A+': { doar: ['A+', 'AB+'], receber: ['A+', 'A-', 'O+', 'O-'] },
            'B-': { doar: ['B+', 'B-', 'AB+', 'AB-'], receber: ['B-', 'O-'] },
            'B+': { doar: ['B+', 'AB+'], receber: ['B+', 'B-', 'O+', 'O-'] },
            'AB-': { doar: ['AB+', 'AB-'], receber: ['AB-', 'A-', 'B-', 'O-'] },
            'AB+': { doar: ['AB+'], receber: ['Todos'] }
        };

        const dados = rules[tipo] || { doar: ['-'], receber: ['-'] };

        this.containerCompatibilidade.innerHTML = `
            <div class="card" style="border-left: 5px solid #ef4444;">
                <h3 class="card-title">📊 Compatibilidade Sanguínea</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: #fdf2f2; padding: 15px; border-radius: 8px;">
                        <span style="font-size: 11px; font-weight: bold; color: #b91c1c;">🔴 PODE DOAR PARA</span>
                        <div style="font-size: 15px; font-weight: bold; color: #991b1b; margin-top: 5px;">${dados.doar.join(', ')}</div>
                    </div>
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">
                        <span style="font-size: 11px; font-weight: bold; color: #16a34a;">🟢 RECEBE DE</span>
                        <div style="font-size: 15px; font-weight: bold; color: #15803d; margin-top: 5px;">${dados.receber.join(', ')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async carregarEstadosIBGE() {
        try {
            const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
            const dados = await res.json();
            this.editEstado.innerHTML = '<option value="">Selecione...</option>' + dados.map(uf => `<option value="${uf.sigla}">${uf.nome}</option>`).join('');
            
            if (this.usuarioLogado.estado) {
                this.editEstado.value = this.usuarioLogado.estado;
                await this.carregarCidadesIBGE(this.usuarioLogado.estado);
            }
        } catch (e) { console.error(e); }
    }

    async carregarCidadesIBGE(siglaUF) {
        if (!siglaUF) return;
        try {
            const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaUF}/municipios?orderBy=nome`);
            const dados = await res.json();
            this.editCidade.innerHTML = '<option value="">Selecione...</option>' + dados.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
            this.editCidade.disabled = false;
            
            if (this.usuarioLogado.cidade) {
                this.editCidade.value = this.usuarioLogado.cidade;
            }
        } catch (e) { console.error(e); }
    }

    async checarNotificacoesUrgenciaRegional() {
        const alertaAtivo = await this.controller.verificarAlertaCidade(
            this.usuarioLogado.cidade,
            this.usuarioLogado.estado,
            this.usuarioLogado.tipoSanguineo
        );

        if (alertaAtivo) {
            this.modalTexto.innerHTML = `O hemocentro de <strong>${this.usuarioLogado.cidade}</strong> precisa urgente de sangue tipo <strong>${this.usuarioLogado.tipoSanguineo}</strong>. Vá até o posto mais próximo!`;
            setTimeout(() => this.modalOverlay.classList.add('active'), 800);
        }
    }
}

window.PainelView = PainelView;