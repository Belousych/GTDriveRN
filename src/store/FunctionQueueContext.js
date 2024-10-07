import React, {createContext, useContext, useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import FunctionQueue from '../utils/FunctionQueue';


const FunctionQueueContext = createContext(null);

// Создаем провайдер для очереди
export const FunctionQueueProvider = ({children}) => {
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    const functionQueue = new FunctionQueue();
    setQueue(functionQueue);

    // Автоматический запуск очереди при восстановлении сети
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        functionQueue.processQueue(); // Запуск очереди при восстановлении сети
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <FunctionQueueContext.Provider value={queue}>
      {children}
    </FunctionQueueContext.Provider>
  );
};

// Кастомный хук для использования очереди в компонентах
export const useFunctionQueue = () => {
  return useContext(FunctionQueueContext);
};
