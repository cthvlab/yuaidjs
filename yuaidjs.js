// Класс для управления реактивными данными
class Reactive {
  constructor(data) {
    this.data = data;
    this.listeners = [];
  }

  set(key, value) {
    this.data[key] = value;
    this.notify();
  }

  get(key) {
    return this.data[key];
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  async fetchData(url) {
    const response = await fetch(url);
    this.set('data', await response.json());
  }

  computed(key, computeFn) {
    Object.defineProperty(this.data, key, {
      get: computeFn,
      enumerable: true,
    });
  }
}

// Класс для создания компонентов
class Component {
  constructor(template, data) {
    this.template = template;
    this.reactiveData = new Reactive(data);
    this.reactiveData.subscribe(() => this.update());
    this.el = this.render();
  }

  render() {
    const html = this.template(this.reactiveData.data);
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
  }

  update() {
    const newHtml = this.template(this.reactiveData.data);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHtml;
    this.el.innerHTML = tempDiv.innerHTML;
  }

  getElement() {
    return this.el;
  }
}

// Компонент для отображения контента
class ContentContainer extends Component {
  constructor(data, router) {
    super(ContentContainer.template, data);
    this.router = router;
    if (data.data && data.data.hits && data.data.hits.length > 0) {
      this.loadContent();
    }
    this.reactiveData.subscribe(() => this.loadContent());
  }

  static template(data) {
    return `
      <div class="content-container">
        ${data.content || 'Загрузка контента...'}
      </div>
    `;
  }

  async loadContent() {
    const hits = this.reactiveData.get('data')?.hits;
    if (hits && hits.length > 0) {
      const contentUrl = `${hits[0].alias}_${hits[0].id}`;
      try {
        this.router.navigate(`/${contentUrl}`);
        const response = await fetch(contentUrl);
        const content = await response.text();
        this.reactiveData.set('content', content);
      } catch (error) {
        this.reactiveData.set('content', 'Ошибка загрузки контента');
      }
    }
  }
}

// Класс для управления роутингом
class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentRoute = null;
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
  }

  handleRouteChange() {
    const path = window.location.pathname;
    const route = this.routes[path] || this.routes['/'];
    if (route) {
      this.render(route);
    }
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    const route = this.routes[path] || this.routes['/'];
    if (route) {
      this.render(route);
    }
  }

  render(route) {
    if (this.currentRoute) {
      this.currentRoute.getElement().remove();
    }
    this.currentRoute = route;
    document.body.appendChild(route.getElement());
  }
}

// Экспортируем классы для использования в других файлах
export { Reactive, Component, ContentContainer, Router };
