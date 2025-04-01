// app.js — пример для интеграции с yuaidjs с гидрацией, роутингом, fetch и WebSocket

// Проверка загрузки yuaidjs и базовая инициализация
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Yuaid === 'undefined') {
    console.error('Yuaidjs не загружен. Убедитесь, что yuaidjs.min.js подключен.');
    return;
  }

  // Класс для реактивных данных
  class ReactiveStore {
    constructor(initialData) {
      this.data = initialData;
      this.listeners = [];
      this.ws = null;
    }

    subscribe(listener) {
      this.listeners.push(listener);
    }

    update(key, value) {
      this.data[key] = value;
      this.notify();
    }

    replace(newData) {
      this.data = { ...this.data, ...newData };
      this.notify();
    }

    notify() {
      this.listeners.forEach(listener => listener(this.data));
    }

    fetchData(apiUrl) {
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => this.replace(data))
        .catch(err => console.error('Ошибка загрузки данных:', err));
    }

    connectWebSocket(wsUrl) {
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.replace(data);
        } catch (e) {
          console.error('Ошибка обработки WebSocket:', e);
        }
      };
      this.ws.onerror = (err) => console.error('WebSocket ошибка:', err);
      this.ws.onclose = () => console.warn('WebSocket соединение закрыто');
    }
  }

  // Класс для компонента
  class AppComponent {
    constructor(selector, templateFn, initialData) {
      this.el = document.querySelector(selector);
      if (!this.el) {
        console.error(`Элемент ${selector} не найден`);
        return;
      }
      this.template = templateFn;
      this.store = new ReactiveStore(initialData);
      this.store.subscribe(data => this.render(data));
      this.render(initialData); // Начальный рендеринг
    }

    render(data) {
      this.el.innerHTML = this.template(data);
    }
  }

  // Простой роутер
  class SimpleRouter {
    constructor(routes, component) {
      this.routes = routes;
      this.component = component;

      // Обработка изменения URL
      window.addEventListener('popstate', () => this.handleRoute());
      document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-route]');
        if (link) {
          e.preventDefault();
          const path = link.getAttribute('href');
          history.pushState(null, '', path);
          this.handleRoute();
        }
      });

      this.handleRoute(); // Инициализация текущего маршрута
    }

    handleRoute() {
      const path = window.location.pathname || '/';
      const apiUrl = this.routes[path];
      if (apiUrl) {
        this.component.store.fetchData(apiUrl);
      } else {
        console.warn(`Маршрут ${path} не найден`);
      }
    }
  }

  // Шаблон для отображения данных (пример с космической темой)
  const spaceTemplate = (data) => {
    const ships = Array.isArray(data.ships) ? data.ships : [];
    const mission = data.mission || 'Неизвестная миссия';
    return `
      <h1>Миссия: ${mission}</h1>
      <ul>
        ${ships.map(ship => `<li>${ship.name} - ${ship.status}</li>`).join('')}
      </ul>
      <nav>
        <a href="/" data-route>Главная</a> | 
        <a href="/fleet" data-route>Флот</a>
      </nav>
      ${ships.length ? '<footer>Готов к запуску</footer>' : '<p>Ожидаем данные...</p>'}
    `;
  };

  // Инициализация приложения
  const initialData = window.__INITIAL_DATA__ || { ships: [], mission: 'Запуск' };
  const app = new AppComponent('#app-container', spaceTemplate, initialData);

  // Подключение WebSocket для обновлений в реальном времени
  app.store.connectWebSocket('ws://localhost:5000/space-updates');

  // Настройка маршрутов
  const routes = {
    '/': 'http://localhost:5000/api/ships',
    '/fleet': 'http://localhost:5000/api/fleet'
  };
  new SimpleRouter(routes, app);
});
