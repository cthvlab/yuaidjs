// Класс для управления реактивными данными
class Reactive {
  constructor(data) {
    this.data = data; // Исходные данные
    this.listeners = []; // Список подписчиков на изменения
  }

  // Устанавливает новое значение для свойства и уведомляет подписчиков
  set(key, value) {
    this.data[key] = value; // Обновление данных
    this.notify(); // Уведомление всех подписчиков об изменении
  }

  // Получает текущее значение свойства
  get(key) {
    return this.data[key];
  }

  // Уведомляет всех подписчиков о том, что данные изменились
  notify() {
    this.listeners.forEach(listener => listener()); // Вызываем все функции-подписчики
  }

  // Добавляет функцию-подписчика, которая будет вызвана при изменении данных
  subscribe(listener) {
    this.listeners.push(listener); // Добавляем подписчика в список
  }

  // Асинхронный метод для получения данных с сервера и обновления состояния
  async fetchData(url) {
    const response = await fetch(url); // Загружаем данные
    this.set('data', await response.json()); // Обновляем данные
  }

  // Поддержка вычисляемых свойств, которые зависят от других данных
  computed(key, computeFn) {
    Object.defineProperty(this.data, key, {
      get: computeFn, // Функция для вычисления значения
      enumerable: true, // Позволяет свойству быть перечисляемым
    });
  }
}

// Класс для создания компонентов, которые могут быть рендерены в DOM
class Component {
  constructor(template, data) {
    this.template = template; // Шаблон, который будет использоваться для рендеринга
    this.reactiveData = new Reactive(data); // Создание реактивных данных для компонента
    this.reactiveData.subscribe(() => this.update()); // Подписка на обновления данных
    this.el = this.render(); // Изначальный рендеринг компонента
  }

  // Рендерит HTML из шаблона и возвращает элемент
  render() {
    const html = this.template(this.reactiveData.data); // Генерация HTML с использованием шаблона
    const div = document.createElement('div'); // Создание контейнера для HTML
    div.innerHTML = html; // Заполнение контейнера HTML
    return div; // Возвращаем элемент
  }

  // Обновляет HTML компонента, когда изменяются данные
  update() {
    const newHtml = this.template(this.reactiveData.data); // Генерация нового HTML с использованием шаблона
    const tempDiv = document.createElement('div'); // Временный контейнер для нового HTML
    tempDiv.innerHTML = newHtml; // Заполнение контейнера новым HTML
    this.el.innerHTML = tempDiv.innerHTML; // Обновляем содержимое компонента
  }

  // Возвращает элемент компонента
  getElement() {
    return this.el; // Возвращаем рендеренный элемент компонента
  }
}

// Класс для управления роутингом
class Router {
  constructor(routes) {
    this.routes = routes; // Храним все маршруты в объекте
    this.currentRoute = null; // Текущий рендеренный маршрут
    window.addEventListener('popstate', this.handleRouteChange.bind(this)); // Слушаем изменения в истории браузера
  }

  // Обрабатывает изменение маршрута (при клике на ссылку или при изменении истории)
  handleRouteChange() {
    const route = this.routes[window.location.pathname]; // Получаем маршрут по текущему пути
    if (route) {
      this.render(route); // Если маршрут найден, рендерим его
    }
  }

  // Метод для перехода по маршруту
  navigate(path) {
    window.history.pushState({}, '', path); // Изменяем URL в истории браузера
    const route = this.routes[path]; // Получаем маршрут для нового пути
    if (route) {
      this.render(route); // Рендерим компонент для нового маршрута
    }
  }

  // Рендерит компонент маршрута на страницу
  render(route) {
    if (this.currentRoute) {
      this.currentRoute.getElement().remove(); // Удаляем предыдущий компонент
    }
    this.currentRoute = route; // Сохраняем новый компонент как текущий
    document.body.appendChild(route.getElement()); // Добавляем новый компонент в DOM
  }
}


