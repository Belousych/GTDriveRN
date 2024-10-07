import React, { useContext, useCallback, useEffect, useState } from 'react';
import { RefreshControl, View, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Icon, Layout, Text, Button } from '@ui-kitten/components';
import { GlobalState } from '../store/global/global.state';
import { UserContext } from '../store/user/UserProvider';
import { getRoutes } from '../api/routes';
import { getCardStatus, addGeofenceToNextPoint, deleteAllGeofences } from '../components/functions';
import { styles } from '../styles';
import useSWR, { useSWRConfig } from 'swr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { useCachedSWR } from '../hook/useCachedSWR';

const HomeScreen = props => {
  

  const [startGeo, setStartGeo] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);
  const { currentUser, currentRoute, setRoute } = useContext(UserContext);
  const context = useContext(GlobalState);
  const {
    data: routes,
    mutate,
    error,
  } = useCachedSWR(`/routes?user=${currentUser}`, () => getRoutes(currentUser));
  const [startRoute, setStartRoute] = useState(null);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  // if (error && !routes) {
  //   mutate(
  //     `/routes?user=${currentUser}`,
  //     getCachedData(`/routes?user=${currentUser}`),
  //     false,
  //   ); // Возвращаем кэшированные данные
  // }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    mutate();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [mutate]);

  React.useEffect(() => {
    if (routes) {
      //console.log({routes});

      deleteSavedPhotos();

      if (!renderComplete) {
        setRenderComplete(true);

        const hasStartGeo =
          routes &&
          Array.isArray(routes) &&
          routes?.some(route => route && route.start === true);

        setStartRoute(hasStartGeo);

        if (hasStartGeo && !startGeo) {
          const startRoute = routes.find(route => route.start === true);
          const uid = startRoute.uid;

          setRoute(uid);

          context.enableGeo();
          setStartGeo(true);

          // Добавляем задачу на подъезд к стартовой точке
          (async () => {
            await addGeofenceToNextPoint(startRoute.startGeo);

            // Далее добавляем задачу на подъезд к остальным точкам, если у нас разрешен режим lite
            for (const point of startRoute.followingPoints) {
              await addGeofenceToNextPoint(point);
            }
          })();
        } else {
          setRoute(null);
          setStartGeo(false);
          context.disableGeo();

          (async () => {
            deleteAllGeofences();
          })();   
        }
      }
    }

    const unsubscribe = navigation.addListener('focus', () => {
      mutate();

      /*const hasStartGeo =
        routes &&
        Array.isArray(routes) &&
        routes?.some(route => route && route.start === true);
      setStartRoute(hasStartGeo);

      if (!hasStartGeo) {
        deleteAllSavedPhotos();
      }

      //context.enableGeo();

      if (hasStartGeo && !startGeo) {
        console.log("@@@ +++ hasStartGeo && !startGeo");

        const startRoute = routes.find(route => route.start === true);
        const uid = startRoute.uid;

        setRoute(uid);

        context.enableGeo();
        setStartGeo(true);
      } else {
        console.log("@@@ --- hasStartGeo && !startGeo");

        setRoute(null);
        setStartGeo(false);
        context.disableGeo();
      }*/
    });

    return unsubscribe;
  }, [navigation, routes, context, startGeo]);

  const handleLongPress = item => {
    //console.log('Вызвано сообщение об удалении элемента');

    Alert.alert(
      'Удаление элемента',
      'Вы уверены, что хотите удалить этот элемент?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', onPress: () => handleDeleteItem(item) },
      ],
    );
  };

  const handleDeleteItem = item => {
    console.log('Элемент успешно удален', item);
    // Обновление списка routes, исключая удаленный элемент
    // TODO тут нужно дернуть ручку удаления элемента

    mutate();

    //console.log('Элемент успешно удален', routes);
  };

  const data =
    routes &&
    Array.isArray(routes) &&
    routes?.slice().sort((a, b) => {
      if (a.start !== b.start) {
        return b.start - a.start;
      } else {
        return a.status - b.status;
      }
    });

  const getCardRouteStatus = item => {
    let status = getCardStatus(item.status);

    if (status === 'info' && item.start === false) {
      status = 'basic';
    }

    return status;
  };

  const renderItemCard = ({ item }) => {
    const currentRoute = item.start;
    const finishRoute = item.status === 3;

    return (
      <Card
        style={[
          styles.containerCards,
          (currentRoute &&
            !finishRoute && { borderWidth: 1, borderColor: '#0092FF' }) ||
          (finishRoute && { borderWidth: 1, borderColor: '#91F2D2' }),
        ]}
        header={() => renderCardHeader(item)}
        status={getCardRouteStatus(item)}
        onPress={() => props.navigation.navigate('RouteScreen', { ...item })}
        onLongPress={() => handleLongPress(item)}>
        <View style={styles.textBodyCardWithLeftView}>
          {renderItemLeft(item)}
          <Text category="c2">{item?.description}</Text>
        </View>
      </Card>
    );
  };

  const renderCardHeader = item => (
    <View style={[styles.textHeaderCard, { padding: 10 }]}>
      <Icon
        name="car-outline"
        width={23}
        height={23}
        style={styles.textHeaderCardIcon}></Icon>
      <Text
        category="label"
        style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', fontSize: 14 }}>
        {item.name}
      </Text>
    </View>
  );

  const renderItemLeft = item => (
    <View style={styles.textTimeLeft}>
      <Layout>
        <Text category="s1" style={{ textAlign: 'center' }}>
          {item?.loading_time}
        </Text>
      </Layout>
      <Layout>
        <Text category="c2" style={{ textAlign: 'center' }}>
          {item?.loading_date}
        </Text>
      </Layout>
    </View>
  );

  async function deleteSavedPhotos() {
    // Получаем все ключи из AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const savedPhotosKeys = keys.filter(uid => uid.startsWith('savedPhotos_'));

    // Текущие маршруты
    const validUids = data.map(item => item.uid);

    // Находим ключи, которые нужно удалить
    const keysToRemove = savedPhotosKeys.filter(key => {
      const uid = key.replace('savedPhotos_', ''); // Извлекаем uid из ключа
      return !validUids.includes(uid); // Проверяем, есть ли uid в validUids
    });

    // Удаляем ненужные ключи из AsyncStorage
    await AsyncStorage.multiRemove(keysToRemove);
  }

  return (
    <SafeAreaView>
      {startRoute && (
        <Text category="label" style={styles.titleList}>
          <Icon
            name="corner-right-down-outline"
            width={20}
            height={20}
            style={styles.textHeaderCardIcon}></Icon>
          Текущий маршрут
        </Text>
      )}

      <FlatList
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
        style={{
          minHeight: '100%',
        }}
        data={data}
        renderItem={renderItemCard}
        keyExtractor={item => item.uid}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
