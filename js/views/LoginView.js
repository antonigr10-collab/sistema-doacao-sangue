/**
 * VIEW: LoginView
 * Responsabilidade: Controlar o formulário de autenticação do doador, capturar as credenciais,
 * repassar para o Controller de forma assíncrona e tratar o redirecionamento.
 */
class LoginView {
    constructor(controller) {
        this.controller = controller;
        this.form = document.getElementById('form-login');
        this.emailInput = document.getElementById('email');
        this.senhaInput = document.getElementById('senha');
    }

    init() {
        if (this.form) {
            // O evento de submit agora é ASSÍNCRONO (async)
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Feedback visual de carregamento
                const btnSubmit = this.form.querySelector('.btn-submit');
                const textoOriginal = btnSubmit.innerText;
                btnSubmit.innerText = 'Autenticando...';
                btnSubmit.disabled = true;

                const email = this.emailInput.value;
                const senha = this.senhaInput.value;

                // Aguarda a resposta do Supabase através do Controller
                const resultado = await this.controller.realizarLogin(email, senha);

                if (resultado.sucesso) {
                    // Armazena a sessão do doador encontrado de forma segura
                    sessionStorage.setItem('usuario_logado', JSON.stringify({
                        id: resultado.doador.id,
                        nome: resultado.doador.nome
                    }));

                    // Redireciona para o painel restrito
                    window.location.href = 'painel.html';
                } else {
                    // Exibe a falha via modal personalizado e restaura o botão no callback
                    this.showAlertModal(resultado.erro || 'Credenciais inválidas ou inexistentes.', () => {
                        btnSubmit.innerText = textoOriginal;
                        btnSubmit.disabled = false;
                    });
                }
            });
        } else {
            console.error("LoginView: Formulário 'form-login' não encontrado no DOM.");
        }
    }

    showAlertModal(message, onClosed) {
        const modal = document.getElementById('svl-alert-modal');
        const desc = document.getElementById('svl-alert-desc');
        const ok = document.getElementById('svl-alert-ok');
        if (!modal || !desc || !ok) {
            // fallback seguro para ambientes sem modal disponível
            window.alert(message);
            if (typeof onClosed === 'function') onClosed();
            return;
        }
        desc.textContent = message;
        modal.classList.add('svl-modal--active');
        modal.setAttribute('aria-hidden', 'false');
        ok.focus();

        const close = () => {
            modal.classList.remove('svl-modal--active');
            modal.setAttribute('aria-hidden', 'true');
            ok.removeEventListener('click', close);
            modal.querySelectorAll('[data-close="true"]').forEach(el => el.removeEventListener('click', close));
            document.removeEventListener('keydown', escHandler);
            if (typeof onClosed === 'function') onClosed();
        };

        const escHandler = (e) => { if (e.key === 'Escape') close(); };

        ok.addEventListener('click', close);
        modal.querySelectorAll('[data-close="true"]').forEach(el => el.addEventListener('click', close, { once: true }));
        document.addEventListener('keydown', escHandler);
    }
}

// Vincula a View globalmente
window.LoginView = LoginView;

// Inicia o ciclo de vida do MVC assim que a tela terminar de carregar
document.addEventListener('DOMContentLoaded', () => {
    const controller = new window.DoadorController();
    const view = new window.LoginView(controller);
    view.init();
});