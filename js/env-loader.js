(function (global) {
    const envCacheKey = '__APP_ENV__';
    const fallbackEnv = {
        SUPABASE_URL: 'https://wjxgtikjsgpyohtoftoa.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqeGd0aWtqc2dweW9odG9mdG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTgyMjYsImV4cCI6MjA5ODQzNDIyNn0.itvxbkvZeRxTOY7ug1XwokCYv62wJml4G49YOlMArpI'
    };

    function parseEnv(text) {
        const values = {};
        text.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex === -1) return;
            const key = trimmed.slice(0, separatorIndex).trim();
            const rawValue = trimmed.slice(separatorIndex + 1).trim();
            values[key] = rawValue.replace(/^['"]|['"]$/g, '');
        });
        return values;
    }

    function normalizeEnv(values) {
        return {
            SUPABASE_URL: values?.SUPABASE_URL || fallbackEnv.SUPABASE_URL,
            SUPABASE_ANON_KEY: values?.SUPABASE_ANON_KEY || fallbackEnv.SUPABASE_ANON_KEY
        };
    }

    async function loadAppEnv() {
        if (global[envCacheKey] && Object.keys(global[envCacheKey]).length > 0) {
            return global[envCacheKey];
        }

        const initialEnv = normalizeEnv(global.env || global[envCacheKey]);
        global.env = initialEnv;
        global[envCacheKey] = initialEnv;
        global.__APP_ENV__ = initialEnv;

        try {
            const envUrl = new URL('.env', global.location.href);
            const response = await fetch(envUrl, { cache: 'no-store' });
            if (response.ok) {
                const text = await response.text();
                const parsedEnv = normalizeEnv(parseEnv(text));
                global[envCacheKey] = parsedEnv;
                global.env = parsedEnv;
                global.__APP_ENV__ = parsedEnv;
                return parsedEnv;
            }
        } catch (error) {
            console.warn('Não foi possível carregar o arquivo .env no navegador. Usando fallback local.', error);
        }

        return global[envCacheKey];
    }

    global.loadAppEnv = loadAppEnv;
    global.env = global.env || fallbackEnv;
    global.__APP_ENV__ = global.__APP_ENV__ || fallbackEnv;
})(window);
