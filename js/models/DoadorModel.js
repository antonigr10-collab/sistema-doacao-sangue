/**
 * MODEL: DoadorModel
 * Gerencia a persistência remota e assíncrona utilizando a API REST do Supabase.
 */

let clienteSupabase = null;

async function obterClienteSupabase() {
    if (clienteSupabase) return clienteSupabase;

    if (!window.supabase) {
        console.error('Erro: A biblioteca do Supabase não foi carregada via CDN. Verifique a tag <script> no HTML.');
        return null;
    }

    const env = await window.loadAppEnv?.();
    const url = env?.SUPABASE_URL || window.__APP_ENV__?.SUPABASE_URL || '';
    const key = env?.SUPABASE_ANON_KEY || window.__APP_ENV__?.SUPABASE_ANON_KEY || '';

    if (!url || !key) {
        console.error('Erro: As variáveis de ambiente do Supabase não foram definidas.');
        return null;
    }

    clienteSupabase = window.supabase.createClient(url, key);
    return clienteSupabase;
}

class DoadorModel {
    constructor() {
        this._cliente = null;
    }

    async getClient() {
        if (this._cliente) return this._cliente;
        this._cliente = await obterClienteSupabase();
        return this._cliente;
    }

    // ==========================================================================
    // PERSISTÊNCIA DE DOADORES (TABELA: doadores)
    // ==========================================================================
    async buscarTodos() {
        const client = await this.getClient();
        if (!client) return [];

        const { data, error } = await client
            .from('doadores')
            .select('*');

        if (error) {
            console.error('Erro ao buscar doadores:', error.message);
            return [];
        }
        return data;
    }

    async buscarPorId(id) {
        const client = await this.getClient();
        if (!client) return null;

        const { data, error } = await client
            .from('doadores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Erro ao buscar doador ${id}:`, error.message);
            return null;
        }
        return data;
    }

    async buscarPorEmail(email) {
        if (!email) return null;
        const client = await this.getClient();
        if (!client) return null;

        const emailTratado = email.trim().toLowerCase();
        const { data, error } = await client
            .from('doadores')
            .select('*')
            .eq('email', emailTratado);

        if (error) {
            console.error('Erro ao buscar e-mail:', error.message);
            return null;
        }
        return data.length > 0 ? data[0] : null;
    }

    async salvar(doador) {
        if (!doador.id) {
            doador.id = 'doa_' + Date.now();
        }

        const client = await this.getClient();
        if (!client) throw new Error('Cliente Supabase indisponível.');

        const { data, error } = await client
            .from('doadores')
            .insert([doador])
            .select();

        if (error) {
            console.error('Erro ao inserir doador:', error.message);
            throw new Error(error.message);
        }
        return data ? data[0] : doador;
    }

    async realizarLogin(email, senha) {
        if (!email || !senha) return null;
        const client = await this.getClient();
        if (!client) return null;

        const emailTratado = email.trim().toLowerCase();
        const { data, error } = await client
            .from('doadores')
            .select('*')
            .eq('email', emailTratado)
            .eq('senha', senha);

        if (error) {
            console.error('Erro na autenticação:', error.message);
            return null;
        }
        return data.length > 0 ? data[0] : null;
    }

    async atualizar(id, dadosAtualizados) {
        const client = await this.getClient();
        if (!client) return null;

        const { data, error } = await client
            .from('doadores')
            .update(dadosAtualizados)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao atualizar doador:', error.message);
            return null;
        }
        return data ? data[0] : null;
    }

    async deletar(idDoador) {
        const client = await this.getClient();
        if (!client) return false;

        const { error } = await client
            .from('doadores')
            .delete()
            .eq('id', idDoador);

        if (error) {
            console.error('Erro ao remover doador:', error.message);
            return false;
        }
        return true;
    }

    // ==========================================================================
    // TABELA DE PEDIDOS DE AJUDA (TABELA: pedidos_ajuda)
    // ==========================================================================
    async buscarTodosPedidos() {
        const client = await this.getClient();
        if (!client) return [];

        const { data, error } = await client
            .from('pedidos_ajuda')
            .select('*');

        if (error) {
            console.error('Erro ao buscar pedidos:', error.message);
            return [];
        }
        return data;
    }

    async salvarPedido(pedido) {
        if (!pedido.id) {
            pedido.id = 'rec_' + Date.now();
        }

        const client = await this.getClient();
        if (!client) throw new Error('Cliente Supabase indisponível.');

        const { data, error } = await client
            .from('pedidos_ajuda')
            .insert([pedido])
            .select();

        if (error) {
            console.error('Erro ao salvar pedido:', error.message);
            throw new Error(error.message);
        }
        return data ? data[0] : pedido;
    }

    async deletarPedido(idPedido) {
        const client = await this.getClient();
        if (!client) return false;

        const { error } = await client
            .from('pedidos_ajuda')
            .delete()
            .eq('id', idPedido);

        if (error) {
            console.error('Erro ao deletar pedido:', error.message);
            return false;
        }
        return true;
    }

    // ==========================================================================
    // ALERTAS REGIONAIS DO ADMINISTRADOR (TABELA: cidades_alerta)
    // ==========================================================================
    async obtendoAlertas() {
        const client = await this.getClient();
        if (!client) return [];

        const { data, error } = await client
            .from('cidades_alerta')
            .select('*');

        if (error) {
            console.error('Erro ao buscar alertas:', error.message);
            return [];
        }
        return data;
    }

    async salvarAlerta(alerta) {
        if (!alerta.id) {
            alerta.id = 'alt_' + Date.now();
        }

        const client = await this.getClient();
        if (!client) throw new Error('Cliente Supabase indisponível.');

        const { data, error } = await client
            .from('cidades_alerta')
            .insert([alerta])
            .select();

        if (error) {
            console.error('Erro ao salvar alerta:', error.message);
            throw new Error(error.message);
        }
        return data ? data[0] : alerta;
    }

    // MÉTODO NOVO: Adicionado para fechar o CRUD do AdminView
    async atualizarAlerta(id, dados) {
        const client = await this.getClient();
        if (!client) return null;

        const { data, error } = await client
            .from('cidades_alerta')
            .update(dados)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro ao atualizar alerta:', error.message);
            return null;
        }
        return data ? data[0] : null;
    }

    async removerAlerta(idAlerta) {
        const client = await this.getClient();
        if (!client) return false;

        const { error } = await client
            .from('cidades_alerta')
            .delete()
            .eq('id', idAlerta);

        if (error) {
            console.error('Erro ao remover alerta:', error.message);
            return false;
        }
        return true;
    }
}

window.DoadorModel = DoadorModel;