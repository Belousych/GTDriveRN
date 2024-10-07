import {useState, useEffect} from 'react';
import useSWR, {useSWRConfig} from 'swr';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getPersistedCache = async key => {
  try {
    const cachedData = await AsyncStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('Не удалось получить кэш', error);
    return null;
  }
};

const persistCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    console.log('Удалось сохранить кэш', data);
  } catch (error) {
    console.error('Не удалось сохранить кэш', error);
  }
};

export const useCachedSWR = (key, fetcher, options = {}) => {
  const {cache} = useSWRConfig();
  const [cachedData, setCachedData] = useState(null);
  const [isCacheReady, setCacheReady] = useState(false);

  // Загрузка кэшированных данных при монтировании
  useEffect(() => {
    const loadCache = async () => {
    //   let data = cache.get(key);
    //   if (!data) {
        let data = await getPersistedCache(key);
    //   }
      setCachedData(data); // Устанавливаем кэшированные данные в состояние
      setCacheReady(true); // Указываем, что кэш готов
    };

    loadCache();
  }, [key, cache]);

  const swr = useSWR(
    isCacheReady ? key : null, // SWR начинает работу, когда кэш готов
    fetcher,
    {
      fallbackData: cachedData, // Используем кэшированные данные как запасные
      revalidateOnFocus: false,
      ...options,
    },
  );

  // Мутируем кэшированные данные при ошибке
  useEffect(() => {
    if (swr.error && cachedData) {
      console.log('Мутируем кэшированные данные при ошибке:', cachedData);
      swr.mutate(cachedData, false); // Мутируем только кэшированные данные
    }
  }, [swr, cachedData]);

  // Сохраняем только поле `data`, когда получаем новые данные
  useEffect(() => {
    if (swr.data) {
      persistCache(key, swr.data); // Кэшируем только данные
    }
  }, [swr.data]);

  return swr;
};
