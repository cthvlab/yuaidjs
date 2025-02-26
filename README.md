
# Yuai DJs

**Yuai DJs** — это легковесный фронтенд-фреймворк для создания динамичных и реактивных веб-приложений. Фреймворк использует паттерн реактивности для автоматического обновления пользовательского интерфейса при изменении данных. Он легко интегрируется в существующие проекты и подходит для создания простых и эффективных UI-решений.

## Особенности

- **Реактивность**: Автоматическое обновление компонентов при изменении данных.
- **Легковесность**: Минимальное количество зависимостей и кода.
- **Простота использования**: Легкая настройка и возможность использовать JSON для создания интерфейсов.
- **Компонентная архитектура**: Удобная структура для создания многократно используемых компонентов.
- **Динамический рендеринг**: Генерация HTML на основе данных в формате JSON.

## Установка

Для использования фреймворка просто добавьте файл `yuaidjs.min.js` в ваш проект.

### Включение в проект

1. Скачайте файл `yuaidjs.min.js` и поместите его в вашу папку с проектом.
2. Подключите его в вашем HTML-файле:

```html
<script src="path/to/yuaidjs.min.js"></script>
```

> Замените `path/to/` на путь, где хранится ваш файл `yuaidjs.min.js`.

## Основные возможности

1. **Реактивные компоненты:** С помощью класса `Reactive` вы можете управлять состоянием данных, автоматически обновляя все компоненты, которые используют эти данные.
   
2. **Роутинг:** Поддержка динамической навигации между страницами и компонентами с изменением URL.

3. **Кастомные события:** Легкая обработка событий через атрибуты `data-event`, что позволяет связывать действия с компонентами.

4. **Асинхронные операции:** Возможность делать асинхронные запросы через метод `fetchData` в классе `Reactive` для получения данных с сервера.

## Пример использования

```javascript
// Создаем компонент
const myComponent = new Component(
  data => `<div><h1>${data.title}</h1><button data-event="click:changeTitle">Change Title</button></div>`,
  { title: 'Hello, YUAI DJs!' }
);

// Добавляем компонент в DOM
document.body.appendChild(myComponent.getElement());

// Реактивные данные и события
myComponent.reactiveData.subscribe(() => {
  console.log('Data updated:', myComponent.reactiveData.data);
});

// Обработка изменения данных
myComponent.reactiveData.set('title', 'New Title');

// Создаем роутер
const appRouter = new Router({
  '/home': new Component(data => `<div><h1>Home Page</h1></div>`, {}),
  '/about': new Component(data => `<div><h1>About Page</h1></div>`, {})
});

// Навигация по страницам
appRouter.navigate('/home');
```

### Обработчик кастомных событий

```html
<button data-event="click:goToHome">Go to Home</button>
<button data-event="click:goToAbout">Go to About</button>
```

## API

### Класс `Reactive`

- **`Reactive(data)`** — Конструктор класса. Принимает начальные данные для компонента.
- **`set(key, value)`** — Устанавливает новое значение для свойства и уведомляет подписчиков.
- **`get(key)`** — Получает значение свойства.
- **`subscribe(listener)`** — Добавляет функцию-подписчика, которая будет вызвана при изменении данных.
- **`fetchData(url)`** — Асинхронный метод для получения данных с сервера.
- **`computed(key, computeFn)`** — Поддержка вычисляемых свойств.

### Класс `Component`

- **`Component(template, data)`** — Создает компонент, используя шаблон и данные.
- **`render()`** — Рендерит компонент в DOM.
- **`update()`** — Обновляет компонент при изменении данных.
- **`getElement()`** — Возвращает элемент компонента.

### Класс `Router`

- **`Router(routes)`** — Создает новый роутер с заданными маршрутами.
- **`navigate(path)`** — Перемещает на указанный маршрут.
- **`render(route)`** — Отображает компонент для текущего маршрута.

## Пример маршрутов

```javascript
const router = new Router({
  '/home': new Component(data => `<h1>Welcome to Home</h1>`, {}),
  '/about': new Component(data => `<h1>About Page</h1>`, {}),
});

router.navigate('/home');
```

## Поддержка кастомных событий

Вы можете добавлять кастомные события к элементам, например:

```html
<button data-event="click:goToAbout">Go to About</button>
<button data-event="click:goToHome">Go to Home</button>
```

Для обработки этих событий используйте делегирование событий, как показано в примере:

```javascript
document.body.addEventListener('click', event => {
  const target = event.target;
  if (target && target.dataset.event) {
    const [eventType, action] = target.dataset.event.split(':');
    if (eventType === 'click') {
      if (action === 'goToAbout') {
        appRouter.navigate('/about');
      } else if (action === 'goToHome') {
        appRouter.navigate('/home');
      }
    }
  }
});
```
## Пример JSON-ответа от сервера
```json
{
  "hits": [
    {
      "alias": "article",
      "id": "123"
    }
  ]
}
```
## Контрибьюции

Мы всегда рады новым идеям и улучшениям. Если вы хотите внести свой вклад в развитие фреймворка, создайте Pull Request в репозитории на GitHub.

## Авторы

Разработано сообществом ЮАИ [yuai.ru](https://yuai.ru) 
