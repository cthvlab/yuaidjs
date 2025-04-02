// yuaidjs.hydrate.js — YUAIDJs качает интерфейс под бит SSR, fetch и WebSocket!

// Reactive — диджейская панель управления данными, всё обновляется по ритму!
export class Reactive {
  constructor(data) {
    this.data = data;
    this.listeners = []; // Слушатели, которые ждут дропа!
    this.socket = null;  // WebSocket для живого эфира с сервером
  }

  // Добавляем подписчиков — пусть слушают каждый новый бит!
  subscribe(callback) {
    this.listeners.push(callback);
  }

  // Меняем один ключ в данных — и сразу качаем!
  set(key, value) {
    this.data[key] = value;
    this.listeners.forEach(cb => cb());
  }

  // Полностью меняем плейлист — апдейтим все!
  replace(newData) {
    this.data = newData;
    this.listeners.forEach(cb => cb());
  }

  // Получаем свежий трек по fetch — сервер кидает новый JSON!
  fetchData(url) {
    fetch(url)
      .then(r => r.json())
      .then(json => {
        this.replace(json);
      })
      .catch(err => console.error('fetchData error:', err));
  }

  // Врубаем WebSocket — прямой эфир из галактики!
  connectWebSocket(wsUrl) {
    try {
      this.socket = new WebSocket(wsUrl, ['binary']);
      this.socket.binaryType = 'arraybuffer';
      this.socket.addEventListener('message', event => {
        try {
          const arrayBuffer = event.data;
          const json = window.msgpack.decode(new Uint8Array(arrayBuffer)); // Декодируем как с винила!
          this.replace(json);
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      });
      this.socket.addEventListener('error', err => {
        console.error('WebSocket error:', err);
      });
      this.socket.addEventListener('close', () => {
        console.warn('WebSocket closed');
      });
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }
}

// Component — наш танцпол. Привязываем шаблон и данные, чтобы дропать HTML по биту!
export class Component {
  constructor(template, data, elId = null, hydrate = false) {
    this.template = template;
    this.reactiveData = new Reactive(data);
    this.el = elId ? document.getElementById(elId) : document.createElement('div');
    this.reactiveData.subscribe(() => this.update());
    if (!hydrate) this.update(); // Если не гидрация — сразу дропаем первый бит!
  }

  // Перерисовываем DOM на основе шаблона — это наш диджейский дроп!
  update() {
    if (this.el) {
      const html = this.template(this.reactiveData.data);
      const template = document.createElement('template');
      template.innerHTML = html;
      this.el.replaceChildren(...template.content.childNodes);
    }
  }
}

// Router — прокладывает маршруты между сценами на фестивале!
export class Router {
  constructor(routes, mountFn) {
    this.routes = routes;
    this.mountFn = mountFn;

    // Когда слушатели переключают треки назад-вперёд
    window.addEventListener('popstate', () => this.navigate(location.pathname));

    // Навигация по ссылкам — всё через data-link
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link instanceof HTMLAnchorElement) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href !== location.pathname) {
          history.pushState(null, '', href);
          this.navigate(href);
        }
      }
    });

    this.navigate(location.pathname); // Первый трек!
  }

  // Загружаем нужную сцену и данные с API
  navigate(path) {
    const url = this.routes[path];
    if (typeof url === 'string') {
      fetch(url)
        .then(r => r.json())
        .then(data => {
          this.mountFn(path, data);
        })
        .catch(err => console.error('Router fetch error:', err));
    }
  }
}

// hydrateComponent — подключаемся к готовой сцене от YUAIRender, без перерисовки
export function hydrateComponent(elId, template, data) {
  const component = new Component(template, data, elId, true);

  // Вешаем глобальный обработчик событий — чтобы реагировать на клики с data-event
  if (!document.body.hasAttribute('data-events-initialized')) {
    document.body.setAttribute('data-events-initialized', 'true');
    document.body.addEventListener('click', e => {
      const target = e.target.closest('[data-event]');
      if (target) {
        const action = target.dataset.event;
        if (typeof action === 'string') {
          const fn = window[action];
          if (typeof fn === 'function') fn(e);
        }
      }
    });
  }

  return component; // Готово, мы подключились к сцене!
}

// Пример шаблона — корабль, пираты и немного сокровищ!
export function pirateTemplate(data) {
  const pirates = Array.isArray(data.pirates) ? data.pirates : [];
  const ship = pirates.length && pirates[0]["s.name"] ? pirates[0]["s.name"] : "";

  return `
    <h1>${ship}</h1>
    ${pirates.map(p => `<p>Сокровище: ${p["p.name"]}</p>`).join('')}
    ${pirates.length ? '<footer>Экипаж готов</footer>' : ''}
  `;
}

// Как это всё подключается (в index.html):
// <script>window.__INITIAL_DATA__ = [...];</script>
// <script type="module">
// import { hydrateComponent, pirateTemplate, Router } from './yuaidjs.hydrate.js';
// const component = hydrateComponent('app', pirateTemplate, { pirates: window.__INITIAL_DATA__ });
// component.reactiveData.connectWebSocket('ws://localhost:4000/updates');
// const routes = {
//   '/': '/api/pirates',
//   '/ships': '/api/ships'
// };
// new Router(routes, (path, data) => component.reactiveData.replace(data));
// </script>
