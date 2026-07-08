/**
 * CONTROLLER: DoadorController
 * Regras de Negócio e Orquestração Assíncrona (Supabase Cloud).
 */
class DoadorController {
    constructor() {
        this.model = new window.DoadorModel();
        this.regexTelefone = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    }

    // ==========================================================================
    // AUTENTICAÇÃO E BUSCA DE DOADORES
    // ==========================================================================
    async realizarLogin(email, senha) {
        if (!email || !senha) return { sucesso: false, erro: 'Preencha todos os campos!' };
        
        try {
            const doador = await this.model.realizarLogin(email, senha);
            if (doador) {
                return { sucesso: true, doador };
            }
            return { sucesso: false, erro: 'Credenciais inválidas ou inexistentes.' };
        } catch (error) {
            console.error("Erro no fluxo de login:", error);
            return { sucesso: false, erro: 'Falha interna na comunicação com o banco.' };
        }
    }

    async buscarPorId(id) {
        try {
            return await this.model.buscarPorId(id);
        } catch (error) {
            console.error("Erro ao buscar doador por ID no controller:", error);
            return null;
        }
    }

    async cadastrarDoador(dadosForm) {
        const erros = {};
        if (!dadosForm.nome || dadosForm.nome.trim().length < 3) erros.nome = "Nome inválido.";
        if (!dadosForm.tipoSanguineo) erros.tipoSanguineo = "Selecione o tipo sanguíneo.";
        if (!dadosForm.email || !dadosForm.email.includes('@')) erros.email = "E-mail inválido.";
        if (!dadosForm.senha || dadosForm.senha.length < 4) erros.senha = "Senha muito curta.";
        if (!dadosForm.aceitouLGPD) erros.lgpd = "A aceitação dos termos de privacidade é obrigatória.";

        if (!dadosForm.telefone || !this.regexTelefone.test(dadosForm.telefone)) {
            erros.telefone = "Telefone deve seguir o padrão (49) 99999-1111.";
        }

        if (Object.keys(erros).length > 0) return { sucesso: false, erros };

        try {
            const doadorExistente = await this.model.buscarPorEmail(dadosForm.email);
            if (doadorExistente) {
                erros.email = "Este e-mail já está cadastrado.";
                return { sucesso: false, erros };
            }
            dadosForm.disponivelParaDoar = false;
            dadosForm.dataDisponibilidade = null;
            const novoDoador = await this.model.salvar(dadosForm);
            return { sucesso: true, doador: novoDoador };
        } catch (error) {
            console.error("Erro no fluxo de cadastro:", error);
            return { sucesso: false, erro: "Falha de persistência na nuvem." };
        }
    }

    async obterListaDoadores() {
        try {
            const doadores = await this.model.buscarTodos();
            for (const doador of doadores) {
                await this.verificarValidadeDisponibilidade(doador);
            }
            return doadores;
        } catch (error) {
            console.error("Erro ao listar doadores:", error);
            return [];
        }
    }

    async excluirDoador(id) {
        try {
            return await this.model.deletar(id);
        } catch (error) {
            console.error("Erro ao remover doador:", error);
            return false;
        }
    }

    // ==========================================================================
    // ATUALIZAÇÃO (UPDATE) - MÉTODOS PARA O CRUD E PERFIL
    // ==========================================================================
    async atualizarPerfil(id, dados) {
        try {
            // Reaproveita o método de atualização do Model do Supabase
            const atualizado = await this.model.atualizar(id, dados);
            return { sucesso: true, dados: atualizado };
        } catch (error) {
            console.error("Erro ao atualizar perfil no controller:", error);
            return { sucesso: false, erro: "Não foi possível salvar as alterações." };
        }
    }

    async atualizarAlerta(id, dados) {
        try {
            return await this.model.atualizarAlerta(id, dados);
        } catch (error) {
            console.error("Erro ao atualizar alerta no controller:", error);
            return false;
        }
    }

    // ==========================================================================
    // ROTINAS DE DISPONIBILIDADE
    // ==========================================================================
    async atualizarDisponibilidade(idDoador, status) {
        // Encaminha a chamada para manter compatibilidade com o nome que a sua View espera
        return await this.atualizarStatusDisponibilidade(idDoador, status);
    }

    async atualizarStatusDisponibilidade(idDoador, status) {
        try {
            const doador = await this.model.buscarPorId(idDoador);
            if (!doador) return { sucesso: false };
            doador.disponivelParaDoar = status;
            doador.dataDisponibilidade = status ? new Date().toISOString() : null;
            const atualizado = await this.model.atualizar(idDoador, doador);
            return { sucesso: true, doador: atualizado };
        } catch (error) {
            console.error("Erro ao alterar disponibilidade:", error);
            return { sucesso: false };
        }
    }

    async verificarValidadeDisponibilidade(doador) {
        if (!doador.disponivelParaDoar || !doador.dataDisponibilidade) return false;
        const dataInicial = new Date(doador.dataDisponibilidade);
        const dataAtual = new Date();
        const diferencaDias = Math.ceil(Math.abs(dataAtual - dataInicial) / (1000 * 60 * 60 * 24));
        if (diferencaDias > 30) {
            doador.disponivelParaDoar = false;
            doador.dataDisponibilidade = null;
            await this.model.atualizar(doador.id, doador);
            return true;
        }
        return false;
    }

    // ==========================================================================
    // GESTÃO DE PEDIDOS E ALERTAS
    // ==========================================================================
    async obterTodosPedidosReceptores() {
        try { return await this.model.buscarTodosPedidos(); } 
        catch (error) { console.error(error); return []; }
    }

    async cadastrarPedido(dadosPedido) {
        try { return await this.model.salvarPedido(dadosPedido); } 
        catch (error) { throw error; }
    }

    async excluirPedidoReceptor(id) {
        try { return await this.model.deletarPedido(id); } 
        catch (error) { return false; }
    }

    async obterCidadesCriticas() {
        try { return await this.model.obtendoAlertas(); } 
        catch (error) { return []; }
    }

    async adicionarAlertaCritico(alerta) {
        try { return await this.model.salvarAlerta(alerta); } 
        catch (error) { throw error; }
    }

    async excluirAlertaCritico(id) {
        try { return await this.model.removerAlerta(id); } 
        catch (error) { return false; }
    }
    
    async verificarAlertaCidade(cidade, estado, tipoSanguineo) {
        if (!cidade || !estado || !tipoSanguineo) return null;
        try {
            const alertas = await this.obterCidadesCriticas();
            return alertas.find(a => 
                a.cidade.toLowerCase() === cidade.toLowerCase() && 
                a.estado.toLowerCase() === estado.toLowerCase() &&
                a.tipoSanguineo === tipoSanguineo
            ) || null;
        } catch (error) { return null; }
    }
}

window.DoadorController = DoadorController;