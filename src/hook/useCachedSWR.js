import {useState, useEffect} from 'react';
import useSWR, {useSWRConfig} from 'swr';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getPersistedCache = async key => {
  try {
    const cachedData = await AsyncStorage.getItem(key);

    console.log('getPersistedCache', {
      cachedData,
    });
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('Failed to retrieve cache', error);
    return null;
  }
};

const persistCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to persist cache', error);
  }
};

export const useCachedSWR = (key, fetcher, options = {}) => {
  const {cache} = useSWRConfig();
  const [cachedData, setCachedData] = useState(null);
  const [isCacheReady, setCacheReady] = useState(false);

  // Получаем кэшированные данные при монтировании
  useEffect(() => {
    const loadCache = async () => {
      let data = cache.get(key);
      if (!data) {
        data = await getPersistedCache(key);
      }
      setCachedData(data); // Устанавливаем кэшированные данные в состояние
      setCacheReady(true); // Указываем, что кэш готов
    };

    loadCache();
  }, [key, cache]);

  const swr = useSWR(
    isCacheReady ? key : null, // useSWR начнет работу только когда кэш будет готов
    fetcher,
    {
      fallbackData: cachedData, // Передаем кэшированные данные как fallbackData
      revalidateOnFocus: false, // Можно отключить повторный запрос при фокусе
      ...options,
    },
  );

  // Проверка на наличие ошибки
  useEffect(() => {
    if (swr.error && cachedData) {
      swr.mutate(cachedData, false); // Возвращаем кэшированные данные при ошибке
    }
  }, [swr.error, cachedData]);

  // Сохраняем новые данные в кэш при их обновлении
  useEffect(() => {
    if (swr.data) {
      persistCache(key, swr.data);
    }
  }, [swr.data]);

  return swr;
};
