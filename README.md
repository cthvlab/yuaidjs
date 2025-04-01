# YuaiDJs: Your User-Activated Interface by Dynamic JavaScript 🚀✨
**YuaiDJs** — это лёгкий JavaScript-фреймворк, созданный специально для тех, кто мечтает бороздить фронтенд-космос на высокой скорости, получать данные с серверов галактики и мгновенно обновлять интерфейс по сигналу из гиперпространства.  
Да-да, он поддерживает всё: **гидрацию**, **fetch**, **WebSocket**, **реактивность**, **роутинг** и работает с серверным рендером `yuairender` https://github.com/cthvlab/yuairender.

> 🚀 Быстрый.  
> 🧠 Умный.  
> 🏴‍☠️ Весёлый.  
> 📦 Один JS-файл, никаких зависимостей.


## 🧩 Что умеет этот летающий корабль?

| Возможность                | Описание                                                                 |
|---------------------------|--------------------------------------------------------------------------|
| ⚡ Реактивность            | Автоматическое обновление DOM при изменении данных (`Reactive`)         |
| 💧 Гидрация               | Подключение к уже отрендеренному HTML от `yuairender` (`hydrateComponent`) |
| 🌐 WebSocket               | Получение данных в реальном времени (без fetch!)                         |
| 🛰️ Fetch                 | Стандартная загрузка JSON-данных с API                                   |
| 🧭 Роутинг                | SPA-навигация без перезагрузок (`Router`)                               |
| 🔮 Кэширование маршрутов   | Переходы по страницам ещё быстрее!                                       |

---

## ⚙️ Установка

Просто подключи скрипт к своей странице (или загрузи локально):

```html
<script src="yuaidjs.js"></script>
```

И вуаля! У тебя появляется глобальный объект `window.YuaidJS`.

---

## 🚀 Пример: гидрация с `yuairender`

```html
<div id="app"></div>

<script>
  // Данные прилетели с сервера в момент первой загрузки страницы:
  window.__INITIAL_DATA__ = {
    pirates: [
      { "s.name": "Черная жемчужина", "p.name": "Джек Воробей" },
      { "s.name": "Черная жемчужина", "p.name": "Уилл Тёрнер" }
    ]
  };

  const { hydrateComponent, pirateTemplate, Router } = window.YuaidJS;

  const component = hydrateComponent('app', pirateTemplate, {
    pirates: window.__INITIAL_DATA__.pirates
  });

  const routes = {
    '/': '/api/pirates',
    '/ships': '/api/ships'
  };

  new Router(routes, (path, url) => {
    component.reactiveData.fetchData(url);
  });
</script>
```

---

## 🔌 Подключение к WebSocket

```js
component.reactiveData.connectWebSocket('wss://пиратский-сервер.зв/сигналы');
```

Теперь любые данные, которые прилетят с сервера — автоматически обновят интерфейс. Никакого fetch, только настоящий сигнал из глубин космоса.

---

## ✨ Шаблон пиратов

```js
function pirateTemplate(data) {
  const pirates = Array.isArray(data.pirates) ? data.pirates : [];
  const ship = pirates.length && pirates[0]["s.name"] ? pirates[0]["s.name"] : "";
  return `
    <h1>${ship}</h1>
    ${pirates.map(p => `<p>Сокровище: ${p["p.name"]}</p>`).join('')}
    ${pirates.length ? '<footer>Экипаж готов</footer>' : ''}
  `;
}
```

---

## ⚓ API кратко

### `new YuaidJS.Reactive(data)`
Создаёт реактивное хранилище данных.

### `reactive.set(key, value)`
Обновляет одно поле.

### `reactive.replace(newData)`
Заменяет все данные.

### `reactive.fetchData(url)`
Загружает JSON и обновляет данные.

### `reactive.connectWebSocket(wsUrl)`
Подключается к серверу по WebSocket и принимает JSON.

### `new YuaidJS.Component(templateFn, data, elId, hydrate?)`
Создаёт компонент, управляет DOM на основе шаблона и данных.

### `YuaidJS.hydrateComponent(elId, templateFn, data)`
Гидрирует уже отрендеренный HTML.

### `new YuaidJS.Router(routes, onNavigate)`
SPA-навигация по `data-link` и `popstate`.

---

## 🛠 Отладка

Включи флаг для подробных логов:

```js
YuaidJS.debug = true;
```



## 🧪 Совместимость

- ✅ Совместим с любыми бэкендами, особенно с [yuairender](https://github.com/cthvlab/yuairender)
- ✅ Работает в любом браузере с поддержкой `ES6`
- ✅ Не требует сборщиков, фреймворков и танцев с бубном



## 🤝 Лицензия

Свободен как космос.  
Лети и грабь галактики, капитан!



Хочешь расширить шхуну? Добавь анимации, вложенные компоненты или свою систему событий — фреймворк не мешает, только помогает.  
YuaidJS — маленький, но дерзкий фреймворк юных космических пиратов! 🏴‍☠️🛸

