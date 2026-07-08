/**
 * VIEW: MuralView
 * Responsabilidade: Renderizar a lista pública de doadores e chamados de urgência.
 * Alinhado perfeitamente com os métodos originais do DoadorController.
 */
class MuralView {
    constructor(controller) {
        this.controller = controller;
        this.corpoDoadores = document.getElementById('mural-doadores-corpo');
        this.corpoPedidos = document.getElementById('mural-pedidos-corpo');
        
        // Inicializa a busca assíncrona dos dados
        this.init();
    }

    async init() {
        try {
            const doadores = await this.controller.obterListaDoadores();
            const alertas = await this.controller.obterCidadesCriticas();

            this.renderizarDoadores(doadores);
            this.renderizarPedidos(alertas);
        } catch (erro) {
            console.error("Erro ao carregar dados na interface do Mural:", erro);
        }
    }

    renderizarDoadores(doadores) {
        if (!this.corpoDoadores) return;
        
        // Evita quebra de código verificando se a resposta é uma lista válida
        if (!Array.isArray(doadores) || doadores.length === 0) {
            this.corpoDoadores.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">Nenhum voluntário em prontidão no momento.</td></tr>';
            return;
        }

        this.corpoDoadores.innerHTML = doadores.map(d => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">👤 ${d.nome || 'Voluntário'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><span class="blood-badge" style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;">${d.tipoSanguineo}</span></td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #16a34a; font-weight: 500;">🔒 Protegido (Disponível via Sistema)</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">📍 ${d.cidade || 'Não informada'} / ${d.estado || 'XX'}</td>
            </tr>
        `).join('');
    }

    renderizarPedidos(alertas) {
        if (!this.corpoPedidos) return;

        if (!Array.isArray(alertas) || alertas.length === 0) {
            this.corpoPedidos.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">Nenhum chamado urgente ativo no momento.</td></tr>';
            return;
        }

        this.corpoPedidos.innerHTML = alertas.map(alerta => {
            const nomePaciente = alerta.nomePaciente || alerta.paciente || alerta.motivo || 'Paciente em necessidade';
            const tipoSanguineo = alerta.tipoSanguineo || alerta.grupoSanguineo || 'Não informado';
            const hospital = alerta.hospital || alerta.local || alerta.unidade || 'Hemocentro regional';
            const contato = alerta.contatoFamiliar || alerta.contato || alerta.responsavel || 'Responsável';
            const cidade = alerta.cidade || alerta.localidade || 'Regional';
            const estado = alerta.estado || alerta.uf || '';
            const localFormatado = estado ? `${cidade}/${estado}` : cidade;

            const valorAtributo = (valor) => String(valor).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

            return `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">🩹 ${nomePaciente}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><span class="blood-badge" style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;">${tipoSanguineo}</span></td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">🏥 ${hospital}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">👥 ${contato}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">📍 ${localFormatado}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                        <a href="#"
                           class="btn-whatsapp-share"
                           data-tipo-sanguineo="${valorAtributo(tipoSanguineo)}"
                           data-hospital="${valorAtributo(hospital)}"
                           data-cidade="${valorAtributo(localFormatado)}">
                            💬 Compartilhar / Ajudar
                        </a>
                    </td>
                </tr>
            `;
        }).join('');

        this.configurarEventosWhatsApp();
    }

    configurarEventosWhatsApp() {
        if (!this.corpoPedidos) return;

        this.corpoPedidos.querySelectorAll('.btn-whatsapp-share').forEach((botao) => {
            botao.addEventListener('click', (evento) => {
                evento.preventDefault();

                const tipoSanguineo = botao.getAttribute('data-tipo-sanguineo') || 'Não informado';
                const hospital = botao.getAttribute('data-hospital') || 'Hemocentro regional';
                const cidade = botao.getAttribute('data-cidade') || 'Região não informada';

                const mensagem = `📢 *APELO URGENTE DE DOAÇÃO DE SANGUE!* 🩸 Precisa-se urgentemente de doadores do tipo *${tipoSanguineo}* para um paciente no *${hospital}* em *${cidade}*. Se você puder ajudar ou conhecer alguém, por favor compartilhe! Salve Vidas! ❤️`;
                const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

                window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
            });
        });
    }
}

// Vincula a classe ao escopo global do navegador
window.MuralView = MuralView;

// Inicializa a View de forma segura assim que a estrutura da página terminar de carregar
document.addEventListener('DOMContentLoaded', () => {
    const controller = new window.DoadorController();
    new window.MuralView(controller);
});