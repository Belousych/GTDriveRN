import AsyncStorage from '@react-native-async-storage/async-storage';

const functionRegistry = {}; // Глобальный реестр для сохранения функций

class FunctionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.delay = 500;

    this.isLoaded = false; // Флаг загрузки очереди

    this.loadQueue(); // Загружаем сохранённую очередь при инициализации
  }

  // Генерация уникального ID для функции
  generateFunctionId() {
    return 'fn_' + Math.random().toString(36).substring(2, 15);
  }

  // Регистрация функции
  registerFunction(functionId, fn) {
    functionRegistry[functionId] = fn;
  }

  // Метод для добавления задачи в очередь
  enqueue(fn, ...args) {
    const functionId = this.generateFunctionId();

    this.registerFunction(functionId, fn); // Регистрация функции перед добавлением

    // Сохраняем ID функции и её аргументы в очередь
    this.queue.push({functionId, args});

    // Сохраняем обновлённую очередь
    this.saveQueue();
  }

  // Метод для обработки очереди
  async processQueue() {
    if (this.isProcessing) return; // Если уже обрабатывается, выходим
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const {functionId, args} = this.queue.shift(); // Достаём ID функции и аргументы
      const currentFunction = functionRegistry[functionId]; // Находим функцию по ID

      console.log('processQueue', currentFunction);
      if (currentFunction) {
        try {
          await currentFunction(...args); // Выполняем функцию с аргументами
        } catch (error) {
          console.error('Ошибка при выполнении функции:', error);
        }
      }

      // Сохраняем обновлённую очередь
      this.saveQueue();

      // Добавляем задержку между функциями
      await this.sleep(this.delay);
    }

    this.isProcessing = false; // Устанавливаем статус обработки
  }

  // Метод для сохранения очереди
  async saveQueue() {
    try {
      // Сохраняем только аргументы и ID функции
      const serializedQueue = this.queue.map(item => ({
        functionId: item.functionId,
        args: JSON.stringify(item.args),
      }));

      await AsyncStorage.setItem(
        'functionQueue',
        JSON.stringify(serializedQueue),
      );
      console.log('Очередь сохранена');
    } catch (error) {
      console.error('Ошибка при сохранении очереди:', error);
    }
  }

  // Метод для загрузки очереди
  async loadQueue() {
    try {
      const savedQueue = await AsyncStorage.getItem('functionQueue');
      if (savedQueue) {
        // Восстанавливаем только ID функций и аргументы
        const parsedQueue = JSON.parse(savedQueue).map(item => ({
          functionId: item.functionId,
          args: JSON.parse(item.args),
        }));
        this.queue = parsedQueue;
        console.log('Очередь загружена', this.queue);

        // Восстанавливаем функции в реестре
        this.restoreFunctions(parsedQueue);
        this.isLoaded = true;
      }
    } catch (error) {
      console.error('Ошибка при загрузке очереди:', error);
    }
  }


   // Метод для восстановления функций в реестре
   restoreFunctions(parsedQueue) {
    parsedQueue.forEach(item => {
      // Восстанавливаем функцию по ID
      if (functionRegistry[item.functionId]) {
        console.log('Восстановление функции:', item.functionId);
      }
    });
  }

  // Функция для задержки (sleep)
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Метод для очистки очереди
  async clearQueue() {
    this.queue = [];
    await AsyncStorage.removeItem('functionQueue');
    console.log('Очередь очищена');
  }
}

export default FunctionQueue;
