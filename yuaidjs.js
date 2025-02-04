// Реактивность
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
}

// Компонент
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

// Рендеринг JSON в HTML
function renderJSON(json) {
  return json.map(item => {
    if (item.type === 'text') {
      return item.content;
    } else if (item.type === 'button') {
      return `<button>${item.label}</button>`;
    }
    return '';
  }).join('');
}

// Пример использования
const jsonData = [
  { type: 'text', content: 'Hello, world!' },
  { type: 'button', label: 'Click Me' },
];

const appData = {
  title: 'My App',
  counter: 0,
};

const appTemplate = (data) => {
  return `
    <h1>${data.title}</h1>
    <p>Counter: ${data.counter}</p>
    ${renderJSON(jsonData)}
  `;
};

const appComponent = new Component(appTemplate, appData);
document.body.appendChild(appComponent.getElement());

// Пример обновления данных
setInterval(() => {
  appData.counter++;
  appComponent.reactiveData.set('counter', appData.counter);
}, 1000);
