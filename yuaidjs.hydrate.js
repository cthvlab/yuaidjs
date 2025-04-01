// yuaidjs.hydrate.js — для интеграции с YUAIRender с роутингом, fetch и WebSocket

export class Reactive {
  constructor(data) {
    this.data = data;
    this.listeners = [];
    this.socket = null;
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  set(key, value) {
    this.data[key] = value;
    this.listeners.forEach(cb => cb());
  }

  replace(newData) {
    this.data = newData;
    this.listeners.forEach(cb => cb());
  }

  fetchData(url) {
    fetch(url)
      .then(r => r.json())
      .then(json => {
        this.replace(json);
      })
      .catch(err => console.error('fetchData error:', err));
  }

  connectWebSocket(wsUrl) {
    try {
      this.socket = new WebSocket(wsUrl);
      this.socket.addEventListener('message', event => {
        try {
          const json = JSON.parse(event.data);
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

export class Component {
  constructor(template, data, elId = null, hydrate = false) {
    this.template = template;
    this.reactiveData = new Reactive(data);
    this.el = elId ? document.getElementById(elId) : document.createElement('div');
    this.reactiveData.subscribe(() => this.update());
    if (!hydrate) this.update();
  }

  update() {
    if (this.el) {
      this.el.innerHTML = this.template(this.reactiveData.data);
    }
  }
}

export class Router {
  constructor(routes, mountFn) {
    this.routes = routes;
    this.mountFn = mountFn;

    window.addEventListener('popstate', () => this.navigate(location.pathname));

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

    this.navigate(location.pathname);
  }

  navigate(path) {
    const url = this.routes[path];
    if (typeof url === 'string') {
      this.mountFn(path, url);
    }
  }
}

export function hydrateComponent(elId, template, data) {
  const component = new Component(template, data, elId, true);

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

  return component;
}

export function pirateTemplate(data) {
  const pirates = Array.isArray(data.pirates) ? data.pirates : [];
  const ship = pirates.length && pirates[0]["s.name"] ? pirates[0]["s.name"] : "";

  return `
    <h1>${ship}</h1>
    ${pirates.map(p => `<p>Сокровище: ${p["p.name"]}</p>`).join('')}
    ${pirates.length ? '<footer>Экипаж готов</footer>' : ''}
  `;
}

// Инициализация (в index.html):
// <script>window.__INITIAL_DATA__ = [...];</script>
// <script type="module">
// import { hydrateComponent, pirateTemplate, Router } from './yuaidjs.hydrate.js';
// const component = hydrateComponent('app', pirateTemplate, { pirates: window.__INITIAL_DATA__ });
// component.reactiveData.connectWebSocket('ws://localhost:4000/updates');
// const routes = {
//   '/': '/api/pirates',
//   '/ships': '/api/ships'
// };
// new Router(routes, (path, url) => component.reactiveData.fetchData(url));
// </script>
