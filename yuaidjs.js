// yuaidjs.js — космическая шхуна YuaidJS, готовая к гиперпрыжкам по звёздам!

class Reactive {
  constructor(data) {
    this.data = data;           // Йо-хо! Это наш сундук с данными, капитан!
    this.listeners = [];        // Матросы, готовые кричать при обновлениях!
    this.socket = null;         // Космическая рация для связи с галактикой!
    this.pendingUpdate = false; // Флаг, чтобы не стрелять из всех пушек сразу!
  }

  subscribe(callback) {
    this.listeners.push(callback); // Новый матрос на борт, слушай приказы!
  }

  set(key, value) {
    this.data[key] = value;    // Меняем карту сокровищ, новый курс!
    this.scheduleUpdate();      // Поднять паруса, пора обновляться!
  }

  replace(newData) {
    this.data = newData;       // Новый груз в трюм, полная замена!
    this.scheduleUpdate();      // Вперёд, на всех парах!
  }

  // Йо-хо-хо! Батчинг через звёздный ветер — обновляем всё одним рывком!
  scheduleUpdate() {
    if (!this.pendingUpdate) {
      this.pendingUpdate = true;
      requestAnimationFrame(() => {
        this.pendingUpdate = false;
        this.listeners.forEach(cb => cb()); // Кричим всем: "Земля на горизонте!"
      });
    }
  }

  fetchData(url) {
    fetch(url)  // Отправляем шлюпку за сокровищами!
      .then(r => r.json())
      .then(json => this.replace(json)) // Грузим добычу в трюм!
      .catch(err => { if (window.YuaidJS?.debug) console.error('fetchData error:', err); }); // Ой, шторм! Ложись в дрейф!
  }

  // Поднимаем антенны для связи с космическими ветрами!
  connectWebSocket(wsUrl) {
    try {
      this.socket = new WebSocket(wsUrl);
      this.socket.addEventListener('message', event => {
        try {
          const json = JSON.parse(event.data);
          this.replace(json); // Новый сигнал с орбиты, обновляем курс!
        } catch (e) {
          if (window.YuaidJS?.debug) console.error('WebSocket message parse error:', e);
        }
      });
      this.socket.addEventListener('error', err => {
        if (window.YuaidJS?.debug) console.error('WebSocket error:', err); // Рация трещит, что-то не так!
      });
      this.socket.addEventListener('close', () => {
        if (window.YuaidJS?.debug) console.warn('WebSocket closed'); // Связь потеряна, капитан!
      });
    } catch (e) {
      if (window.YuaidJS?.debug) console.error('WebSocket connection error:', e); // Ошибка в гиперпространстве!
    }
  }
}

class Component {
  constructor(template, data, elId, hydrate = false) {
    this.template = template;    // Карта звёздного неба для рендера!
    this.reactiveData = new Reactive(data); // Наш сундук с данными!
    this.el = document.getElementById(elId); // Палуба корабля, куда грузим добычу!
    this.lastRendered = '';      // Последний курс, чтобы не дрейфовать зря!
    if (!this.el) throw new Error(`Element with id "${elId}" not found`); // Нет палубы? Бунт на борту!
    this.reactiveData.subscribe(() => this.update()); // Слушаем штормовые ветры изменений!
    if (!hydrate) this.update(); // Не гидрация? Тогда сразу к бою!
  }

  // Быстрее ветра! Рисуем звёзды на небе одним махом!
  update() {
    const html = this.template(this.reactiveData.data);
    if (html === this.lastRendered) return; // Курс тот же? Спим дальше, юнги!
    this.lastRendered = html;

    const template = document.createElement('template'); // Волшебный сундук для магии DOM!
    template.innerHTML = html; // Грузим карту в сундук!
    const fragment = document.createDocumentFragment(); // Быстрый шторм, собираем всё в кучу!
    fragment.appendChild(template.content); // Перекладываем добычу!
    this.el.replaceChildren(fragment); // Новый курс на палубе, без лишнего шума!
  }
}

class Router {
  constructor(routes, mountFn) {
    this.routes = routes;       // Карта звёздных путей, капитан!
    this.mountFn = mountFn;     // Боцман, который кричит, куда плыть!
    this.cache = new Map();     // Сундук с уже пройденными маршрутами!

    window.addEventListener('popstate', () => this.navigate(location.pathname)); // Слушаем повороты штурвала!

    document.body.addEventListener('click', e => { // Ловим клики по звёздным компасам!
      const link = e.target.closest('[data-link]');
      if (link instanceof HTMLAnchorElement) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href !== location.pathname) {
          history.pushState(null, '', href); // Новый курс в истории!
          this.navigate(href); // Плывём по звёздам!
        }
      }
    });

    this.navigate(location.pathname); // Стартуем с текущей гавани!
  }

  // Плывём по маршруту, проверяем сундук с кэшем!
  navigate(path) {
    const url = this.routes[path];
    if (typeof url === 'string') {
      if (this.cache.has(path)) {
        this.mountFn(path, this.cache.get(path)); // Из сундука, быстро!
      } else {
        this.mountFn(path, url); // Новый путь, грузим с нуля!
        this.cache.set(path, url); // В сундук на память!
      }
    }
  }
}

// Гидрация — поднимаем паруса с готовой карты!
function hydrateComponent(elId, template, data) {
  const component = new Component(template, data, elId, true);

  if (!document.body.hasAttribute('data-events-initialized')) {
    document.body.setAttribute('data-events-initialized', 'true');
    document.body.addEventListener('click', e => { // Ловим сигналы с мостика!
      const target = e.target.closest('[data-event]');
      if (target) {
        const action = target.dataset.event;
        if (typeof action === 'string') {
          const fn = window[action];
          if (typeof fn === 'function') fn(e); // Выполняем приказ капитана!
        }
      }
    });
  }

  return component; // Корабль готов к бою, капитан!
}

// Пиратский шаблон для весёлых космических приключений!
function pirateTemplate(data) {
  const pirates = Array.isArray(data.pirates) ? data.pirates : [];
  const ship = pirates.length && pirates[0]["s.name"] ? pirates[0]["s.name"] : "";
  return `
    <h1>${ship}</h1>
    ${pirates.map(p => `<p>Сокровище: ${p["p.name"]}</p>`).join('')}
    ${pirates.length ? '<footer>Экипаж готов</footer>' : ''}
  `;
}

window.YuaidJS = {
  Reactive,
  Component,
  Router,
  hydrateComponent,
  pirateTemplate,
  debug: true // Йо-хо! Включаем пиратские крики для отладки!
};
