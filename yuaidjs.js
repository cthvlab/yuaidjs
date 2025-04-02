// yuaidjs.js — YUAIDJs миксует биты на космическоv крейсере или скоростном звездолете и даже на шлюпке!

class Reactive {
  constructor(data) {
    this.data = data;           // Дропаем базу! Это наш главный трек с данными, пираты!
    this.listeners = [];        // Слушатели в зале, готовые качать под каждый новый бит!
    this.socket = null;         // Космическая вертушка для прямого эфира с галактикой!
    this.pendingUpdate = false; // Флаг, чтобы не закидывать треки слишком быстро, держим ритм!
    this.unusedData = new WeakMap(); // Тайник для старых пластинок, чтоб не грузить память!
    this.cache = new Map();     // Кэш-хиты для быстрого доступа, как плейлист yuaidb!
    this.cleanupInterval = setInterval(() => this.cleanupUnused(), 60000); // Чистим танцпол каждые 60 сек!
  }

  subscribe(callback) {
    this.listeners.push(callback); // Новый гость на вечеринке, врубайтесь в бит, юнги!
  }

  set(key, value) {
    this.data[key] = value;    // Меняем пластинку, новый грув на танцполе!
    this.scheduleUpdate();      // Врубай микшер, пора качать обновления!
  }

  replace(newData) {
    if (this.data && typeof this.data === 'object') {
      this.unusedData.set(this, this.data); // Старый трек в тайник, освобождаем место!
    }
    this.data = newData;       // Новый микс в эфир, полный дроп!
    this.scheduleUpdate();      // Врубай бит, капитан, танцпол гудит!
  }

  // Батчинг через звёздный вайб — один дроп, и все в деле!
  scheduleUpdate() {
    if (!this.pendingUpdate) {
      this.pendingUpdate = true;
      // Используем requestIdleCallback для chill-обновлений или rAF для быстрого дропа!
      (window.requestIdleCallback || window.requestAnimationFrame)(() => {
        this.pendingUpdate = false;
        this.listeners.forEach(cb => cb()); // Все в зале кричат: "Дропай бит!"
      });
    }
  }

  // Чистим старые треки, чтобы танцпол был свежим!
  cleanupUnused() {
    this.unusedData = new WeakMap(); // Новый тайник, старье в утиль!
    if (window.YUAIDJs?.debug) console.log('Танцпол чист, капитан, врубай бит!');
  }

  fetchData(url) {
    if (this.cache.has(url)) { // Хит из кэша yuaidb, дропаем сразу!
      this.replace(this.cache.get(url));
      return Promise.resolve();
    }
    return fetch(url)  // Спинним новую пластинку с сервера!
      .then(r => r.json())
      .then(json => {
        this.cache.set(url, json); // Кэшируем этот грув для быстрого доступа!
        this.replace(json); // Дропаем на танцпол!
      })
      .catch(err => { if (window.YUAIDJs?.debug) console.error('Ошибка на вертушке:', err); }); // Шторм на танцполе, держим ритм!
  }

  // Врубай бинарный бит через WebSocket, прямой эфир с галактической сцены!
  connectWebSocket(wsUrl) {
    try {
      this.socket = new WebSocket(wsUrl, ['binary']); // Бинарный грув, быстрее света!
      this.socket.binaryType = 'arraybuffer'; // Данные как сырые биты, юнги!
      this.socket.addEventListener('message', event => {
        try {
          const arrayBuffer = event.data;
          const json = window.msgpack.decode(new Uint8Array(arrayBuffer)); // Декодируем бинарный микс!
          this.replace(json); // Новый трек в эфире, качаем!
        } catch (e) {
          if (window.YUAIDJs?.debug) console.error('Ошибка в бинарном груве:', e);
        }
      });
      this.socket.addEventListener('error', err => {
        if (window.YUAIDJs?.debug) console.error('Вертушка сломалась:', err); // Проблемы на сцене!
      });
      this.socket.addEventListener('close', () => {
        if (window.YUAIDJs?.debug) console.warn('Эфир прерван, капитан!'); // Вечеринка на паузе!
      });
      this.socket.addEventListener('open', () => {
        if (window.YUAIDJs?.debug) console.log('Эфир врубили, ленивая загрузка на старте!');
      });
    } catch (e) {
      if (window.YUAIDJs?.debug) console.error('Ошибка подключения к сцене:', e); // Гиперпространственный сбой!
    }
  }

  // Сериализуем грув для других пиратов на вечеринке!
  toJSON() {
    return JSON.stringify(this.data); // Микс в строке, готов к раздаче!
  }

  // Десериализуем трек от другого диджея!
  static fromJSON(json) {
    return new Reactive(JSON.parse(json)); // Новый объект с грувом, врубай бит!
  }
}

// Мини-Virtual DOM — микшер для точечных дропов на танцполе!
function diffAndPatch(oldNodes, newNodes, parent) {
  const keyed = new Map();    // Карта ключевых битов, держим порядок!
  const oldByIndex = new Map(); // Индексы для остальных треков!

  oldNodes.forEach((node, i) => {
    if (node.nodeType === 1 && node.dataset.key) {
      keyed.set(node.dataset.key, node); // Ключевой хит в плейлисте!
    } else {
      oldByIndex.set(i, node); // Просто трек по порядку!
    }
  });

  newNodes.forEach((newNode, i) => {
    const key = newNode.dataset?.key;
    const existing = key ? keyed.get(key) : oldByIndex.get(i);

    if (!existing && newNode) {
      parent.appendChild(newNode); // Новый бит на сцену, дропай!
    } else if (existing && !newNode) {
      existing.remove(); // Старый трек выключаем, юнги!
    } else if (existing && newNode) {
      if (newNode.nodeName !== existing.nodeName || !newNode.isEqualNode(existing)) {
        if (newNode.nodeType === 1 && existing.nodeType === 1) {
          diffAndPatch(Array.from(existing.childNodes), Array.from(newNode.childNodes), existing); // Миксуем вложенные биты!
          existing.replaceWith(newNode); // Заменяем корень, если дети в порядке!
        } else {
          parent.replaceChild(newNode, existing); // Полный дроп, новый грув!
        }
      }
    }
    if (key) keyed.delete(key); // Убираем использованный хит!
    oldByIndex.delete(i);
  });

  keyed.forEach(node => node.remove()); // Лишние треки — в утиль!
  oldByIndex.forEach(node => node.remove()); // Чистим остатки!
}

class Component {
  constructor(template, data, elId, hydrate = false) {
    this.template = typeof template === 'string' ? this.precompileTemplate(template) : template; // Предкомпиляция или готовый микс!
    this.reactiveData = new Reactive(data); // Главный сундук с грувом!
    this.el = document.getElementById(elId); // Танцпол, где качаем биты!
    this.lastRendered = '';      // Последний дроп в памяти!
    this.eventListeners = new Map(); // Карта для диджейских движений!
    if (!this.el) throw new Error(`Танцпол с id "${elId}" не найден, юнги!`);
    this.reactiveData.subscribe(() => this.update()); // Слушаем бит и врубляем микшер!
    if (!hydrate) this.update(); // Не гидрация? Дропаем сразу!
  }

  // Предкомпиляция — готовим трек для быстрого спина!
  precompileTemplate(templateString) {
    return (data) => {
      const pirates = Array.isArray(data.pirates) ? data.pirates : [];
      const ship = pirates.length && pirates[0]["s.name"] ? pirates[0]["s.name"] : "";
      return templateString
        .replace('${ship}', ship) // Название шхуны в заголовке!
        .replace('${pirates}', pirates.map(p => `<p data-key="${p["p.name"]}">Сокровище: ${p["p.name"]}</p>`).join('')) // Ключевые биты пиратов!
        .replace('${footer}', pirates.length ? '<footer>Экипаж в деле!</footer>' : ''); // Футер, если танцпол полон!
    };
  }

  // Миксуем танцпол, дропаем только нужные биты!
  update() {
    const html = this.template(this.reactiveData.data);
    if (html === this.lastRendered) return; // Тот же грув? Чиллим дальше!
    this.lastRendered = html;

    const template = document.createElement('template'); // Сундук для новых треков!
    template.innerHTML = html; // Грузим свежий микс!
    const newNodes = Array.from(template.content.childNodes); // Новые биты на сцене!
    const oldNodes = Array.from(this.el.childNodes); // Старые треки с танцпола!
    diffAndPatch(oldNodes, newNodes, this.el); // Миксуем только нужное!
  }

  // Врубай движ — события прямо на танцполе!
  on(event, selector, callback) {
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target) callback(e); // Танцуем, если попали в бит!
    };
    this.eventListeners.set(callback, listener);
    this.el.addEventListener(event, listener);
  }

  off(event, callback) {
    const listener = this.eventListeners.get(callback);
    if (listener) {
      this.el.removeEventListener(event, listener);
      this.eventListeners.delete(callback); // Убираем старый движ!
    }
  }
}

class Router {
  constructor(routes, mountFn) {
    this.routes = routes;       // Плейлист маршрутов, капитан!
    this.mountFn = mountFn;     // Диджей, который кричит, куда спиннить!
    this.cache = new Map();     // Кэш для хитов маршрутов!

    window.addEventListener('popstate', () => this.navigate(location.pathname)); // Ловим повороты вертушки!

    document.body.addEventListener('click', e => { // Ловим клики по космическим пультам!
      const link = e.target.closest('[data-link]');
      if (link instanceof HTMLAnchorElement) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href !== location.pathname) {
          history.pushState(null, '', href); // Новый трек в истории!
          this.navigate(href); // Спинним новый маршрут!
        }
      }
    });

    this.navigate(location.pathname); // Стартуем с текущего хита!
  }

  // Спинним маршрут, проверяем кэш для быстрого дропа!
  async navigate(path) {
    const url = this.routes[path];
    if (typeof url === 'string') {
      if (this.cache.has(path)) {
        this.mountFn(path, this.cache.get(path)); // Хит из кэша, врубай!
      } else {
        try {
          const response = await fetch(url); // Грузим новый трек!
          const data = await response.json();
          this.cache.set(path, data); // В кэш для следующего спина!
          this.mountFn(path, data); // Дропаем на танцпол!
        } catch (e) {
          if (window.YUAIDJs?.debug) console.error('Ошибка спина маршрута:', e);
        }
      }
    }
  }
}

// Гидрация — врубай бит с готового микса от yuairender!
function hydrateComponent(elId, template, data) {
  const component = new Component(template, data, elId, true);

  if (!document.body.hasAttribute('data-events-initialized')) {
    document.body.setAttribute('data-events-initialized', 'true');
    document.body.addEventListener('click', e => { // Ловим движения на танцполе!
      const target = e.target.closest('[data-event]');
      if (target) {
        const action = target.dataset.event;
        if (typeof action === 'string') {
          const fn = window[action];
          if (typeof fn === 'function') fn(e); // Диджейский приказ в эфире!
        }
      }
    });
  }

  return component; // Шхуна готова качать, капитан!
}

// Шаблон для предкомпиляции — базовый грув вечеринки!
const pirateTemplateString = `
  <h1>\${ship}</h1>
  \${pirates}
  \${footer}
`;

// Ленивая загрузка через WebSocket — дропаем бит после старта!
function lazyLoadWebSocket(component, wsUrl) {
  requestAnimationFrame(() => {
    component.reactiveData.connectWebSocket(wsUrl); // Врубай эфир, юнги!
  });
}

window.YUAIDJs = {
  Reactive,
  Component,
  Router,
  hydrateComponent,
  pirateTemplate: pirateTemplateString,
  lazyLoadWebSocket,
  debug: true // Врубай дебаг, чтобы все видели, как мы качаем!
};
