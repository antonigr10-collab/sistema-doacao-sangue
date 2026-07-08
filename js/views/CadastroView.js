/**
 * VIEW: CadastroView
 * Responsabilidade: Controlar o preenchimento de dados da tela de cadastro, consumo do IBGE,
 * banner de cookies da LGPD, aplicação de máscara dinâmica de telefone em tempo real
 * e gerenciar o fluxo lógico do Quiz de Triagem Prévia.
 */
class CadastroView {
    constructor(controller) {
        this.controller = controller;

        this.form = document.getElementById('form-cadastro');
        this.msgGlobal = document.getElementById('msg-cadastro');
        this.selectEstado = document.getElementById('estado');
        this.selectCidade = document.getElementById('cidade');
        this.txtTelefone = document.getElementById('telefone');
        
        // Elementos Obrigatórios LGPD
        this.chkTermoLgpd = document.getElementById('termo-lgpd');
        this.bannerLgpd = document.getElementById('banner-lgpd');
        this.btnAceitarLgpd = document.getElementById('btn-aceitar-lgpd');

        this.modalSuccess = document.getElementById('cadastro-success-modal');
        this.modalSuccessBtn = document.getElementById('cadastro-modal-btn-ok');
        this.modalSuccessOverlay = document.querySelector('.cadastro-modal__overlay');

        this.loadEstado = document.getElementById('load-estado');
        this.loadCidade = document.getElementById('load-cidade');

        // ELEMENTOS ADICIONADOS DO SISTEMA DE TRIAGEM
        this.containerTriagem = document.getElementById('container-triagem');
        this.containerInapto = document.getElementById('container-inapto');
        this.containerCadastroReal = document.getElementById('container-cadastro-real');
        this.formTriagem = document.getElementById('form-triagem');
        this.btnRefazerTriagem = document.getElementById('btn-refazer-triagem');
    }

    init() {
        // Ativa os listeners específicos do Quiz de Triagem primeiro
        this.inicializarLogicaTriagem();

        if (!this.form) return;

        // Ativa monitoramento de privacidade da LGPD
        this.verificarConsentimentoBanner();

        // Inicializa combos sincronizados do IBGE
        this.carregarEstadosIBGE();
        this.selectEstado.addEventListener('change', (e) => this.carregarCidadesIBGE(e.target.value));

        // EVENTO DE MÁSCARA DINÂMICA ENQUANTO O USUÁRIO DIGITA
        if (this.txtTelefone) {
            this.txtTelefone.addEventListener('input', (e) => this.aplicarMascaraTelefone(e));
        }

        // O evento de submit permanece idêntico e assíncrono para o Supabase
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processarCadastro();
        });

        if (this.modalSuccessBtn) {
            this.modalSuccessBtn.addEventListener('click', () => this.closeSuccessModal(true));
        }

        if (this.modalSuccessOverlay) {
            this.modalSuccessOverlay.addEventListener('click', () => this.closeSuccessModal(true));
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modalSuccess && this.modalSuccess.classList.contains('active')) {
                this.closeSuccessModal(true);
            }
        });
    }

    /**
     * SISTEMA DE TRIAGEM INTERNO
     * Gerencia a interceptação do fluxo antes da liberação do formulário real
     */
    inicializarLogicaTriagem() {
        if (this.formTriagem) {
            this.formTriagem.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const q1 = document.querySelector('input[name="q1"]:checked')?.value;
                const q2 = document.querySelector('input[name="q2"]:checked')?.value;
                const q3 = document.querySelector('input[name="q3"]:checked')?.value;

                if (!q1 || !q2 || !q3) {
                    alert("Por favor, responda a todas as perguntas da triagem.");
                    return;
                }

                // Critério oficial: Se houver qualquer resposta "nao", é considerado inapto
                if (q1 === 'sim' && q2 === 'sim' && q3 === 'sim') {
                    this.containerTriagem.style.display = 'none';
                    this.containerInapto.style.display = 'none';
                    this.containerCadastroReal.style.display = 'block'; // Mostra o formulário original
                } else {
                    this.containerTriagem.style.display = 'none';
                    this.containerCadastroReal.style.display = 'none';
                    this.containerInapto.style.display = 'block'; // Bloqueia e mostra o alerta
                }
            });
        }

        if (this.btnRefazerTriagem) {
            this.btnRefazerTriagem.addEventListener('click', () => {
                if (this.formTriagem) this.formTriagem.reset();
                this.containerInapto.style.display = 'none';
                this.containerCadastroReal.style.display = 'none';
                this.containerTriagem.style.display = 'block';
            });
        }
    }

    /** 
     * MÁSCARA DINÂMICA DE TELEFONE
     * Transforma "49999991111" em "(49) 99999-1111" em tempo de execução.
     */
    aplicarMascaraTelefone(evento) {
        let valor = evento.target.value;
        valor = valor.replace(/\D/g, "");

        if (valor.length > 11) {
            valor = valor.substring(0, 11);
        }

        if (valor.length > 0) {
            valor = "(" + valor;
        }
        if (valor.length > 3) {
            valor = valor.substring(0, 3) + ") " + valor.substring(3);
        }
        if (valor.length > 10) {
            valor = valor.substring(0, 10) + "-" + valor.substring(10);
        }

        evento.target.value = valor;
    }

    verificarConsentimentoBanner() {
        if (!this.bannerLgpd || !this.btnAceitarLgpd) return;

        const aceitouTermos = localStorage.getItem('lgpd_consentimento_geral');
        if (!aceitouTermos) {
            this.bannerLgpd.classList.remove('hide');
        }

        this.btnAceitarLgpd.addEventListener('click', () => {
            localStorage.setItem('lgpd_consentimento_geral', 'true');
            this.bannerLgpd.classList.add('hide');
        });
    }

    async carregarEstadosIBGE() {
        if (this.loadEstado) this.loadEstado.style.display = 'inline-block';
        try {
            const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
            const dados = await res.json();
            this.selectEstado.innerHTML = '<option value="">Selecione...</option>';
            dados.forEach(uf => {
                const opt = document.createElement('option');
                opt.value = uf.sigla; opt.textContent = uf.nome;
                this.selectEstado.appendChild(opt);
            });
        } catch (err) {
            console.error("Erro ao consumir API do IBGE", err);
        } finally {
            if (this.loadEstado) this.loadEstado.style.display = 'none';
        }
    }

    async carregarCidadesIBGE(siglaUF) {
        if (!siglaUF) {
            this.selectCidade.innerHTML = '<option value="">Selecione o estado...</option>';
            this.selectCidade.disabled = true;
            return;
        }
        if (this.loadCidade) this.loadCidade.style.display = 'inline-block';
        try {
            const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaUF}/municipios?orderBy=nome`);
            const dados = await res.json();
            this.selectCidade.innerHTML = '<option value="">Selecione...</option>';
            dados.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.nome; opt.textContent = c.nome;
                this.selectCidade.appendChild(opt);
            });
            this.selectCidade.disabled = false;
        } catch (err) {
            console.error("Erro ao buscar municípios", err);
        } finally {
            if (this.loadCidade) this.loadCidade.style.display = 'none';
        }
    }

    async processarCadastro() {
        this.limparMensagensErros();

        if (this.chkTermoLgpd && !this.chkTermoLgpd.checked) {
            const errTermo = document.getElementById('err-termo-lgpd');
            if (errTermo) errTermo.textContent = "Você precisa aceitar os Termos de Privacidade para prosseguir.";
            this.msgGlobal.textContent = "Erro: Aceite obrigatório dos termos de privacidade pendente.";
            this.msgGlobal.className = "message-box error";
            this.msgGlobal.classList.remove('hide');
            return;
        }

        const payload = {
            nome: document.getElementById('nome').value,
            tipoSanguineo: document.getElementById('tipoSanguineo').value,
            telefone: this.txtTelefone.value,
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            estado: this.selectEstado.value,
            cidade: this.selectCidade.value,
            aceitouLGPD: true 
        };

        const btnSubmit = this.form.querySelector('button[type="submit"]');
        const txtOriginal = btnSubmit.textContent;
        btnSubmit.textContent = "Salvando na nuvem...";
        btnSubmit.disabled = true;

        const resultado = await this.controller.cadastrarDoador(payload);

        btnSubmit.textContent = txtOriginal;
        btnSubmit.disabled = false;

        if (resultado.sucesso) {
            this.msgGlobal.classList.add('hide');
            this.form.reset();
            this.selectCidade.disabled = true;
            this.showSuccessModal();
        } else {
            this.msgGlobal.textContent = "Por favor, corrija as inconsistências apontadas no formulário.";
            this.msgGlobal.className = "message-box error";
            this.msgGlobal.classList.remove('hide');
            if (resultado.erros) {
                 this.exibirErrosCampos(resultado.erros);
            } else if (resultado.erro) {
                 this.msgGlobal.textContent = resultado.erro; 
            }
        }
    }

    exibirErrosCampos(erros) {
        Object.keys(erros).forEach(campo => {
            const spanErro = document.getElementById(`err-${campo}`);
            if (spanErro) spanErro.textContent = erros[campo];
        });
    }

    limparMensagensErros() {
        this.msgGlobal.classList.add('hide');
        this.msgGlobal.textContent = "";
        const spans = document.querySelectorAll('.error-text');
        spans.forEach(s => s.textContent = "");
        const errTermo = document.getElementById('err-termo-lgpd');
        if (errTermo) errTermo.textContent = "";
    }

    showSuccessModal() {
        if (!this.modalSuccess) return;
        this.modalSuccess.classList.add('active');
        this.modalSuccess.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeSuccessModal(redirect = false) {
        if (!this.modalSuccess) return;
        this.modalSuccess.classList.remove('active');
        this.modalSuccess.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (redirect) {
            window.location.href = 'login.html';
        }
    }
}

window.CadastroView = CadastroView;