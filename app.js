// Пример использования фреймворка YuaidJS
(function() {
  // Начальные данные
  const initialData = {
    data: null,
    content: ''
  };

  // Создаем роутер
  const routes = {};
  const router = new YuaidJS.Router(routes);

  // Создаем экземпляр ContentContainer с передачей роутера
  const contentComp = new YuaidJS.ContentContainer(initialData, router);

  // Добавляем маршрут по умолчанию
  routes['/'] = contentComp;

  // Инициализация приложения
  async function init() {
    await contentComp.reactiveData.fetchData('https://yuai.ru/');
    const hits = contentComp.reactiveData.get('data')?.hits;
    if (hits && hits.length > 0) {
      const contentUrl = `/${hits[0].alias}_${hits[0].id}`;
      routes[contentUrl] = contentComp;
      router.navigate(contentUrl);
    } else {
      router.navigate('/');
    }
  }

  // Запускаем приложение при загрузке страницы
  window.addEventListener('load', init);
})();
