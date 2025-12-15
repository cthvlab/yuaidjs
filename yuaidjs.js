if (window.YUAIDJsInitialised) {
    console.log('YUAIDJs за вертушками!');
} else {
    window.YUAIDJsInitialised = true;

    const YUAIDJs = {
        modules: {},
        activeAnimations: new Map(),
        _initialised: false,
        _eventHandlersAttached: false,
        _serviceWorkerRegistered: false,

        config: {
            debug: false,
            devMode: false,
            maxRetries: 3,
            retryDelay: 1000,
            fatalErrors: 0,
            maxFatalErrors: 3,
            _circuitOpen: false,
            _updateLock: false,
            defaultContainer: 'yuaidjs-app',
            defaultTransition: 'fade',
            rpcEndpoint: 'wss://endlessdub.ru',
            modules: {
                animation: true,
                auth: false,
                speech: false,
                radio: true,
                video: false,
                file: false,
                call: false,
                chat: false,
                screen: false,
                record: false,
                notify: false,
                wasm: false,
                pwa: true,
                visualizer: true,
                tontelegram: false
            }
        },

        logDebug(message, data = {}) {
            if (this?.config?.debug) console.log(`YUAIDJs: ${message}`, { ...data });
        },

        logError(message, error, context = {}) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const errorMessage = `${message}: ${errMsg}`;

            console.error(`YUAIDJs: ${errorMessage}`, { ...context, error });

            const fatalCategories = ['fetch', 'updateByKey', 'dom', 'navigation'];

            if (fatalCategories.includes(context.category)) {
                this.fatalErrors = (this.fatalErrors || 0) + 1;

                if (this.fatalErrors >= (this.maxFatalErrors || 3) && !this._circuitOpen) {
                    this._circuitOpen = true;
                    console.error('YUAIDJs: Circuit breaker открыт');
                    this.kill();
                }
            }

            if (this?.config?.debug) {
                const errorLog = document.getElementById('error-log');
                if (errorLog) {
                    const errorNode = document.createElement('div');
                    errorNode.textContent =
                        `[${new Date().toLocaleTimeString()}] ${errorMessage} (${context.category || 'general'})`;
                    errorLog.appendChild(errorNode);
                }
            }
        },

        async loadModule(name) { 
			try {

				const suffix = this.config.devMode ? '' : '.min';
				const cacheBust = this.config.devMode ? `?t=${Date.now()}` : '';
				const url = `/modules/${name}${suffix}.js${cacheBust}`;
				
				const module = await import(url);
				this.modules[name] = module.default(this) || {};
				this.logDebug(`Модуль ${name}${suffix} загружен`);
			} catch (err) {
				this.logError(`Не удалось загрузить модуль ${name}`, err, { category: 'module' });
			}
		},

        async postToServiceWorker(message) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                try {
                    navigator.serviceWorker.controller.postMessage(message);
                    this.logDebug('Сообщение отправлено Service Worker', message);
                } catch (err) {
                    this.logError('Не удалось отправить сообщение Service Worker', err, { category: 'serviceWorker' });
                }
            }
        },

        async clearServiceWorkerCache() {
            await this.postToServiceWorker({ type: 'clearCache' });
        },

        async init(config = {}) {
            if (this._initialised) {
                this.logDebug('init пропущен — уже выполнен ранее');
                return;
            }
            this._initialised = true;

            Object.assign(this.config, config);

            this.isActive = true;

            this.logError = this.logError.bind(this);
            this.logDebug = this.logDebug.bind(this);
            this.updateDOM = this.updateDOM.bind(this);
            this.generateTarget = this.generateTarget.bind(this);
            this.sanitizeHTML = this.sanitizeHTML.bind(this);

            await Promise.all(
                Object.keys(this.config.modules)
                    .filter(name => this.config.modules[name])
                    .map(name => this.loadModule(name))
            );

            Object.entries(this.modules).forEach(([name, mod]) => {
                if (mod && typeof mod.setup === 'function') {
                    try {
                        mod.setup();
                        this.logDebug(`Модуль ${name}: setup выполнен`);
                    } catch (err) {
                        this.logError(`Ошибка setup модуля ${name}`, err, { category: 'module' });
                    }
                } else if (this.config.debug && mod) {
                    this.logDebug(`Модуль ${name}: функция setup не предоставлена`);
                }
            });

            this.setupEventHandlers();

            if (!this._serviceWorkerRegistered && !this.config.devMode && 'serviceWorker' in navigator) {
                try {
                    this.logDebug('Регистрация Service Worker');
                    const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
                    await navigator.serviceWorker.ready; 
                    this.logDebug('Service Worker зарегистрирован', registration);
                    this._serviceWorkerRegistered = true;

                    await this.postToServiceWorker({
                        type: 'updateConfig',
                        data: {
                            devMode: this.config.devMode,
                            maxRetries: this.config.maxRetries,
                            retryDelay: this.config.retryDelay,
                            rpcEndpoint: this.config.rpcEndpoint
                        }
                    });
                } catch (err) {
                    this.logError('Регистрация Service Worker не удалась', err, { category: 'serviceWorker' });
                }
            } else if (this.config.devMode && 'serviceWorker' in navigator) {
                this.logDebug('Service Worker пропущен в режиме разработки');
                await this.clearServiceWorkerCache();
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                    this.logDebug('Service Worker отменен в режиме разработки');
                }
                this._serviceWorkerRegistered = false;
            }

            if ('serviceWorker' in navigator && !this._serviceWorkerMessageHandlerAttached) {
                this._serviceWorkerMessageHandler = (event) => {
                    const { type, message, category } = event.data || {};
                    if (type === 'error') {
                        this.logError(message, new Error(message), { category });
                    } else {
                        this.logDebug(`Сообщение Service Worker: ${type}`, event.data);
                    }
                };
                navigator.serviceWorker.addEventListener('message', this._serviceWorkerMessageHandler);
                this._serviceWorkerMessageHandlerAttached = true;
            }

            localStorage.setItem('yuaidjs-state', 'active');
            this.logDebug('Инициализация завершена');
        },

        async kill() {
            try {
                this.isActive = false;
                this._initialised = false;

                for (const [id, animation] of this.activeAnimations) {
                    cancelAnimationFrame(animation);
                    this.activeAnimations.delete(id);
                }

                for (const name of Object.keys(this.modules)) {
                    const mod = this.modules[name];
                    if (mod && typeof mod.cleanup === 'function') {
                        try {
                            mod.cleanup();
                            this.logDebug(`Модуль ${name} очищен`);
                        } catch (err) {
                            this.logError(`Не удалось очистить модуль ${name}`, err, { category: 'module' });
                        }
                    }
                    delete this.modules[name];
                }

                document.querySelectorAll('script[data-yuaidjs-visualizator], canvas').forEach(el => el.remove());

                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                        await reg.unregister();
                        this.logDebug('Service Worker отменен');
                    }
                    if (this._serviceWorkerMessageHandler && this._serviceWorkerMessageHandlerAttached) {
                        navigator.serviceWorker.removeEventListener('message', this._serviceWorkerMessageHandler);
                        this._serviceWorkerMessageHandlerAttached = false;
                        this._serviceWorkerMessageHandler = null;
                    }
                    this._serviceWorkerRegistered = false;
                }

                if (this._eventHandler && this._eventHandlersAttached) {
                    document.removeEventListener('click', this._eventHandlerBound, { capture: true });
                    document.removeEventListener('submit', this._eventHandlerBound, { capture: true });
                    window.removeEventListener('popstate', this._eventHandlerBound);
                    this._eventHandlerBound = null;
                    this._eventHandlersAttached = false;
                }

                if (this.config.debug && typeof console.clear === 'function') {
                    console.clear();
                    console.log('YUAIDJs: Консоль очищена');
                }

                const toggleButton = document.querySelector('[data-yuaidjs-toggle]');
                if (toggleButton) toggleButton.textContent = 'Revive YUAIDJs';

                localStorage.setItem('yuaidjs-state', 'killed');
                this.logDebug('Успешно остановлен (Killed)');
                location.reload();
            } catch (err) {
                this.logError('Не удалось остановить YUAIDJs', err, { category: 'kill' });
            }
        },

        async revive() {
            try {
                this.isActive = false;
                this.modules = {};
                await this.init({ ...this.config });
                const toggleButton = document.querySelector('[data-yuaidjs-toggle]');
                if (toggleButton) toggleButton.textContent = 'Kill YUAIDJs';
                this.logDebug('Успешно восстановлен (Revived)');
            } catch (err) {
                this.logError('Не удалось восстановить YUAIDJs', err, { category: 'revive' });
            }
        },

        setupEventHandlers() {
            if (this._eventHandlersAttached) {
                this.logDebug('Глобальные обработчики событий уже установлены, пропускаем');
                return;
            }

            let lastClickTime = 0;
            const clickDebounce = 500;

            this._eventHandler = async (e) => {
                if (e.type === 'click' && e.target.matches('[data-yuaidjs-toggle]')) {
                    e.preventDefault();
                    this[this.isActive ? 'kill' : 'revive']();
                    return;
                }

                if (!this.isActive) {
                    this.logDebug(`${e.type} пропущен, YUAIDJs остановлен (killed)`);
                    return;
                }

                if (e.type === 'click') {
                    const link = e.target.closest('a[href]');
                    if (!link) return;
                    const currentTime = Date.now();
                    if (currentTime - lastClickTime < clickDebounce) return;
                    lastClickTime = currentTime;

                    e.preventDefault();
                    try {
                        const url = new URL(link.href, location.origin);
                        const updateKey = link.getAttribute('data-yuaidjs-update-key');
                        const updateUrl = link.getAttribute('data-yuaidjs-update-url') || link.href;

                        if (url.origin === location.origin) {
                            if (updateKey) {
                                this.logDebug('Нажата ссылка для updateByKey', { updateKey, updateUrl });
                                await this.updateByKey(updateKey, updateUrl, { transition: this.config.defaultTransition });
                            } else if (url.hash && url.pathname === location.pathname && url.search === location.search) {
                                const element = document.querySelector(url.hash);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                    history.pushState({ url: url.toString() }, '', url);
                                }
                            } else if (url.pathname === location.pathname && url.search === location.search && url.hash === location.hash) {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                await this.navigateTo(url.pathname + url.search + url.hash);
                            }
                        } else {
                            this.logDebug('Внешняя ссылка, выполняется стандартная навигация', url);
                            window.location.href = link.href;
                        }
                    } catch (err) {
                        this.logError('Ошибка навигации', err, { category: 'navigation', href: link.href });
                    }
                } else if (e.type === 'submit') {
                    const form = e.target.closest('form');
                    if (!form || !form.action) {
                        this.logError('Ошибка формы', new Error(form ? 'Отсутствует действие (action)' : 'Форма не найдена'), { category: 'form' });
                        return;
                    }
                    e.preventDefault();
                    try {
                        const url = new URL(form.action, location.origin);
                        if (url.origin !== location.origin) {
                            this.logError('Внешняя форма, выполняется стандартная отправка', new Error('Внешний URL'), { category: 'form', action: form.action });
                            form.dispatchEvent(new Event('submit', { cancelable: true }));
                            return;
                        }
                        const updateKey = form.getAttribute('data-yuaidjs-update-key');
                        if (form.method.toUpperCase() === 'GET') {
                            const params = new URLSearchParams();
                            for (const [key, value] of new FormData(form)) {
                                if (typeof value === 'string' && value) params.append(key, value);
                            }
                            url.search = params.toString();
                        }
                        if (updateKey) {
                            await this.updateByKey(updateKey, url.toString(), { transition: this.config.defaultTransition });
                        } else {
                            await this.navigateTo(url.toString());
                        }
                    } catch (err) {
                        this.logError('Ошибка отправки формы', err, { category: 'form', action: form.action });
                    }
                } else if (e.type === 'popstate' && e.state?.url) {
                    try {
                        this.logDebug('Событие Popstate', e.state.url);
                        await this.navigateTo(e.state.url, true);
                    } catch (err) {
                        this.logError('Ошибка навигации Popstate', err, { category: 'navigation', url: e.state.url });
                    }
                }
            };

            this._eventHandlerBound = this._eventHandler.bind(this);
            document.addEventListener('click', this._eventHandlerBound, { capture: true });
            document.addEventListener('submit', this._eventHandlerBound, { capture: true });
            window.addEventListener('popstate', this._eventHandlerBound);
            this._eventHandlersAttached = true;
        },

        async navigateTo(url, replace = false) {
            try {
                await this.updateByKey(this.config.defaultContainer, url, { transition: this.config.defaultTransition });
                const html = await this.fetchPage(url);
                document.title = html.match(/<title>(.*?)<\/title>/i)?.[1] || 'YUAIDJs';
                const state = { url };
                if (replace) history.replaceState(state, '', url);
                else history.pushState(state, '', url);
            } catch (err) {
                this.logError('Навигация не удалась', err, { category: 'navigation', url });
            }
        },

        async updateByKey(key, url, options = {}) {
            if (this._circuitOpen || this._updateLock) {
                this.logDebug('updateByKey пропущен', { key, url });
                return;
            }

            this._updateLock = true;

            const { transition = this.config.defaultTransition, retries = this.config.maxRetries } = options;
            let attempt = 0;

            try {
                while (attempt < retries) {
                    try {
                        this.logDebug(`Попытка updateByKey ${attempt + 1} для #${key} из ${url}`);
                        const html = await this.fetchPage(url);
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const newNode = doc.getElementById(key);
                        if (!newNode) throw new Error(`Элемент с id="${key}" не найден`);

                        let target = document.getElementById(key);
                        if (!target) {
                            target = document.createElement('div');
                            target.id = key;
                            target.classList.add('yuaidjs-result');
                            target.setAttribute('aria-live', 'polite');
                            (document.activeElement?.closest('form, button, a') || document.body)
                                .insertAdjacentElement('afterend', target);
                        }

                        await this.updateDOM(target, newNode, transition);
                        this.fatalErrors = 0;
                        this.logDebug(`updateByKey успешно завершен для #${key}`);
                        return;
                    } catch (err) {
                        this.logError(`Попытка updateByKey ${attempt + 1} не удалась`, err, { category: 'updateByKey', url, key });
                        if (++attempt >= retries) throw err;
                        await new Promise(r => setTimeout(r, this.config.retryDelay));
                    }
                }
            } finally {
                this._updateLock = false;
            }
        },

        async updateDOM(target, newNode, transition) {
            try {
                if (!target || !newNode) throw new Error('Недопустимая цель (target) или узел (node)');
                if (this.config.modules.animation && this.modules.animation) {
                    await this.modules.animation.yuaianimate(target, transition, () => {
                        target.innerHTML = '';
                        target.append(...newNode.childNodes);
                    });
                } else {
                    target.innerHTML = '';
                    target.append(...newNode.childNodes);
                }
                this.logDebug(`DOM обновлен с ${transition} для ${target.id || 'unknown'}`);
            } catch (err) {
                this.logError('Обновление DOM не удалось', err, { category: 'dom', target: target?.id || 'unknown' });
                throw err;
            }
        },

        async fetchPage(url) {
            try {
                if (!navigator.onLine) throw new Error('Нет подключения к сети');
                const noCacheUrl = this.config.devMode ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url;
                const response = await fetch(noCacheUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'text/html', ...(this.config.devMode && { 'Cache-Control': 'no-store' }) },
                    cache: this.config.devMode ? 'no-cache' : 'default'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const contentType = response.headers.get('Content-Type') || '';
                if (!contentType.includes('text/html')) throw new Error(`Неподдерживаемый тип контента: ${contentType}`);
                return await response.text();
            } catch (err) {
                this.logError('Запрос (Fetch) не удался', err, { category: 'fetch', url });
                throw err;
            }
        },

        generateTarget(dataAttribute, timer) {
            const btn = document.querySelector(`[${dataAttribute}]`);
            if (!btn) {
                this.logError(
                    'Элемент для генерации цели не найден',
                    new Error('Недопустимый элемент'),
                    { category: 'generateTarget', attribute: dataAttribute }
                );
                return null;
            }

            const resultAttr = `${dataAttribute}-result`;
            let target = btn.nextElementSibling;

            if (target && target.getAttribute(resultAttr)) {
                return target;
            }

            target = document.createElement('div');
            target.classList.add('yuaidjs-result');
            target.setAttribute(
                resultAttr,
                btn.getAttribute(dataAttribute) || `auto-${Date.now()}`
            );
            target.setAttribute('aria-live', 'polite');

            btn.insertAdjacentElement('afterend', target);

            let ttl = timer;

            if (!Number.isFinite(ttl)) {
                const attrTtl = btn.getAttribute('data-yuaidjs-ttl');
                if (attrTtl !== null) {
                    ttl = Number(attrTtl);
                }
            }

            if (Number.isFinite(ttl) && ttl > 0) {
                setTimeout(() => {
                    if (target.isConnected) {
                        target.remove();
                        this.logDebug('Цель автоматически удалена (ttl)', {
                            attribute: dataAttribute,
                            ttl
                        });
                    }
                }, ttl * 1000);
            }

            return target;
        },

        sanitizeHTML(html) {
            const div = document.createElement('div');
            div.textContent = String(html);
            return div.innerHTML.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
    };

    async function startYUAIDJs() {
        if (window.YUAIDJsStarted) {
            console.log('YUAIDJs: startYUAIDJs уже вызывался, пропуск');
            return;
        }
        window.YUAIDJsStarted = true;

        if (localStorage.getItem('yuaidjs-state') === 'killed') {
            const toggleButton = document.querySelector('[data-yuaidjs-toggle]');
            if (toggleButton) {
                toggleButton.textContent = 'Revive YUAIDJs';
                toggleButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    localStorage.setItem('yuaidjs-state', 'active');
                    location.reload();
                }, { capture: true });
            }
            console.log('YUAIDJs: Пропущена инициализация из-за состояния "killed" (остановлено)');
            return;
        }

        YUAIDJs.isActive = true;
        try {
            await YUAIDJs.init();
            localStorage.setItem('yuaidjs-state', 'active');
        } catch (err) {
            console.error('YUAIDJs: Критическая ошибка init', err);
            localStorage.setItem('yuaidjs-state', 'error');
            window.YUAIDJsStarted = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startYUAIDJs);
    } else {
        startYUAIDJs();
    }
}
