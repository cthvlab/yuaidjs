// app.js — пример использования yuaidjs с компонентами, роутингом и WebSocket

document.addEventListener('DOMContentLoaded', () => {
  // Проверка, что YuaidJS доступен
  if (typeof YuaidJS === 'undefined') {
    console.error('YuaidJS не загружен. Подключите yuaidjs.js.');
    return;
  }

  // Шаблон для отображения данных (космическая тема)
  const spaceTemplate = (data) => {
    const ships = Array.isArray(data.ships) ? data.ships : [];
    const mission = data.mission || 'Ожидание данных';
    return `
      <h1>Миссия: ${mission}</h1>
      <ul>
        ${ships.map(ship => `<li>${ship.name} - ${ship.status}</li>`).join('')}
      </ul>
      <nav>
        <a href="/" data-link>Главная</a> | 
        <a href="/fleet" data-link>Флот</a>
      </nav>
      ${ships.length ? '<footer>Готов к запуску</footer>' : '<p>Загрузка...</p>'}
    `;
  };

  // Инициализация компонента с начальными данными
  const initialData = window.__INITIAL_DATA__ || { ships: [], mission: 'Запуск' };
  const appComponent = new YuaidJS.Component({
    elId: 'app-container',
    template: spaceTemplate,
    data: initialData,
    hydrate: !!window.__INITIAL_DATA__ // Гидратация, если есть начальные данные
  });

  // Подключение WebSocket для обновлений в реальном времени
  appComponent.reactiveData.connectWebSocket('ws://localhost:5000/space-updates');

  // Настройка роутинга
  const routes = {
    '/': 'http://localhost:5000/api/ships',
    '/fleet': 'http://localhost:5000/api/fleet'
  };
  new YuaidJS.Router(routes, (path, url) => {
    appComponent.reactiveData.fetchData(url);
  });
});
