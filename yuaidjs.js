// Глобальный объект для фреймворка YuaidJS
window.YuaidJS = window.YuaidJS || {};

// Класс для управления реактивными данными
YuaidJS.Reactive = function(data) {
  this.data = data;
  this.listeners = [];
};

YuaidJS.Reactive.prototype.set = function(key, value) {
  this.data[key] = value;
  this.notify();
};

YuaidJS.Reactive.prototype.get = function(key) {
  return this.data[key];
};

YuaidJS.Reactive.prototype.notify = function() {
  this.listeners.forEach(function(listener) { listener(); });
};

YuaidJS.Reactive.prototype.subscribe = function(listener) {
  this.listeners.push(listener);
};

YuaidJS.Reactive.prototype.fetchData = async function(url) {
  const response = await fetch(url);
  this.set('data', await response.json());
};

YuaidJS.Reactive.prototype.computed = function(key, computeFn) {
  Object.defineProperty(this.data, key, {
    get: computeFn,
    enumerable: true
  });
};

// Класс для создания компонентов
YuaidJS.Component = function(template, data) {
  this.template = template;
  this.reactiveData = new YuaidJS.Reactive(data);
  this.reactiveData.subscribe(this.update.bind(this));
  this.el = this.render();
};

YuaidJS.Component.prototype.render = function() {
  const html = this.template(this.reactiveData.data);
  const div = document.createElement('div');
  div.className = 'yuaidjs-component'; // Добавляем класс с названием фреймворка
  div.innerHTML = html;
  return div;
};

YuaidJS.Component.prototype.update = function() {
  const newHtml = this.template(this.reactiveData.data);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = newHtml;
  this.el.innerHTML = tempDiv.innerHTML;
};

YuaidJS.Component.prototype.getElement = function() {
  return this.el;
};

// Компонент для отображения контента
YuaidJS.ContentContainer = function(data, router) {
  YuaidJS.Component.call(this, YuaidJS.ContentContainer.template, data);
  this.router = router;
  if (data.data && data.data.hits && data.data.hits.length > 0) {
    this.loadContent();
  }
  this.reactiveData.subscribe(this.loadContent.bind(this));
};

YuaidJS.ContentContainer.prototype = Object.create(YuaidJS.Component.prototype);
YuaidJS.ContentContainer.prototype.constructor = YuaidJS.ContentContainer;

YuaidJS.ContentContainer.template = function(data) {
  return `
    <div class="yuaidjs-content-container">
      ${data.content || 'Загрузка контента...'}
    </div>
  `;
};

YuaidJS.ContentContainer.prototype.loadContent = async function() {
  const hits = this.reactiveData.get('data')?.hits;
  if (hits && hits.length > 0) {
    const contentUrl = `${hits[0].alias}_${hits[0].id}`;
    try {
      this.router.navigate(`/${contentUrl}`);
      const response = await fetch(contentUrl);
      const content = await response.text();
      this.reactiveData.set('content', content);
    } catch (error) {
      this.reactiveData.set('content', 'Ошибка загрузки контента (YuaidJS)');
    }
  }
};

// Класс для управления роутингом
YuaidJS.Router = function(routes) {
  this.routes = routes;
  this.currentRoute = null;
  window.addEventListener('popstate', this.handleRouteChange.bind(this));
};

YuaidJS.Router.prototype.handleRouteChange = function() {
  const path = window.location.pathname;
  const route = this.routes[path] || this.routes['/'];
  if (route) {
    this.render(route);
  }
};

YuaidJS.Router.prototype.navigate = function(path) {
  window.history.pushState({}, 'YuaidJS Route', path); // Добавляем название в title истории
  const route = this.routes[path] || this.routes['/'];
  if (route) {
    this.render(route);
  }
};

YuaidJS.Router.prototype.render = function(route) {
  if (this.currentRoute) {
    this.currentRoute.getElement().remove();
  }
  this.currentRoute = route;
  document.body.appendChild(route.getElement());
};
