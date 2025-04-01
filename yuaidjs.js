// yuaidjs.js — автономная версия фреймворка YuaidJS с поддержкой WebSocket

class Reactive {
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
  }
}

class Component {
  constructor({ elId, template, data = {}, hydrate = false }) {
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

class Router {
  constructor(routes, onNavigate) {
    this.routes = routes;
    this.onNavigate = onNavigate;

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
      this.onNavigate(path, url);
    }
  }
}

function hydrateComponent(elId, template, data) {
  const component = new Component({ elId, template, data, hydrate: true });

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

window.YuaidJS = {
  Reactive,
  Component,
  Router,
  hydrateComponent
};
