import {
  Button,
  Layout,
  Text,
  ButtonGroup,
  Icon,
  List,
  Card,
  Toggle,
  Modal,
  BottomNavigation,
  BottomNavigationTab,
  Spinner,
} from '@ui-kitten/components';
import {SvgXml} from 'react-native-svg';
import {
  getCardStatus,
  getToggleCardStatus,
  getDataPostRoute,
  getDateFromJSON,
  addGeofenceToNextPoint,
} from '../components/functions.js';
import {
  NavigationContainer,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import React, {useEffect, useCallback, useState} from 'react';
import AddPhoto from '../components/AddPhoto/AddPhoto';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RefreshControl, Alert, Linking, View} from 'react-native';
import {openAddressOnMap} from '../utils/openAddressOnMap';
import {RouterListItem} from '../types';
import {postRoute} from '../api/routes';
import {ScrollView} from 'react-native-gesture-handler';
import useSWR, {useSWRConfig} from 'swr';
import find from 'lodash/find';
import AccidentScreen from './AccidentScreen';
import {styles} from '../styles';
import {useNavigation} from '@react-navigation/native';
import {getReq, getRequest} from '../api/request.js';
import NetInfo from '@react-native-community/netinfo';
import FunctionQueue from '../utils/FunctionQueue.js';
import localStorage from '../store/localStorage';
import {useCachedSWR} from '../hook/useCachedSWR.js';

//type Props = {};

const telegramXml = `
  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 32 32">
    <path fill="#FFFFFF" d="M 26.070313 3.996094 C 25.734375 4.011719 25.417969 4.109375 25.136719 4.21875 L 25.132813 4.21875 C 24.847656 4.332031 23.492188 4.902344 21.433594 5.765625 C 19.375 6.632813 16.703125 7.757813 14.050781 8.875 C 8.753906 11.105469 3.546875 13.300781 3.546875 13.300781 L 3.609375 13.277344 C 3.609375 13.277344 3.25 13.394531 2.875 13.652344 C 2.683594 13.777344 2.472656 13.949219 2.289063 14.21875 C 2.105469 14.488281 1.957031 14.902344 2.011719 15.328125 C 2.101563 16.050781 2.570313 16.484375 2.90625 16.722656 C 3.246094 16.964844 3.570313 17.078125 3.570313 17.078125 L 3.578125 17.078125 L 8.460938 18.722656 C 8.679688 19.425781 9.949219 23.597656 10.253906 24.558594 C 10.433594 25.132813 10.609375 25.492188 10.828125 25.765625 C 10.933594 25.90625 11.058594 26.023438 11.207031 26.117188 C 11.265625 26.152344 11.328125 26.179688 11.390625 26.203125 C 11.410156 26.214844 11.429688 26.21875 11.453125 26.222656 L 11.402344 26.210938 C 11.417969 26.214844 11.429688 26.226563 11.441406 26.230469 C 11.480469 26.242188 11.507813 26.246094 11.558594 26.253906 C 12.332031 26.488281 12.953125 26.007813 12.953125 26.007813 L 12.988281 25.980469 L 15.871094 23.355469 L 20.703125 27.0625 L 20.8125 27.109375 C 21.820313 27.550781 22.839844 27.304688 23.378906 26.871094 C 23.921875 26.433594 24.132813 25.875 24.132813 25.875 L 24.167969 25.785156 L 27.902344 6.65625 C 28.007813 6.183594 28.035156 5.742188 27.917969 5.3125 C 27.800781 4.882813 27.5 4.480469 27.136719 4.265625 C 26.769531 4.046875 26.40625 3.980469 26.070313 3.996094 Z M 25.96875 6.046875 C 25.964844 6.109375 25.976563 6.101563 25.949219 6.222656 L 25.949219 6.234375 L 22.25 25.164063 C 22.234375 25.191406 22.207031 25.25 22.132813 25.308594 C 22.054688 25.371094 21.992188 25.410156 21.667969 25.28125 L 15.757813 20.75 L 12.1875 24.003906 L 12.9375 19.214844 C 12.9375 19.214844 22.195313 10.585938 22.59375 10.214844 C 22.992188 9.84375 22.859375 9.765625 22.859375 9.765625 C 22.886719 9.3125 22.257813 9.632813 22.257813 9.632813 L 10.082031 17.175781 L 10.078125 17.15625 L 4.242188 15.191406 L 4.242188 15.1875 C 4.238281 15.1875 4.230469 15.183594 4.226563 15.183594 C 4.230469 15.183594 4.257813 15.171875 4.257813 15.171875 L 4.289063 15.15625 L 4.320313 15.144531 C 4.320313 15.144531 9.53125 12.949219 14.828125 10.71875 C 17.480469 9.601563 20.152344 8.476563 22.207031 7.609375 C 24.261719 6.746094 25.78125 6.113281 25.867188 6.078125 C 25.949219 6.046875 25.910156 6.046875 25.96875 6.046875 Z"></path>
  </svg>
`;

const whatsappXml = `
  <svg fill="#fff" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 308 308" xml:space="preserve" stroke="#fff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="XMLID_468_"> <path id="XMLID_469_" d="M227.904,176.981c-0.6-0.288-23.054-11.345-27.044-12.781c-1.629-0.585-3.374-1.156-5.23-1.156 c-3.032,0-5.579,1.511-7.563,4.479c-2.243,3.334-9.033,11.271-11.131,13.642c-0.274,0.313-0.648,0.687-0.872,0.687 c-0.201,0-3.676-1.431-4.728-1.888c-24.087-10.463-42.37-35.624-44.877-39.867c-0.358-0.61-0.373-0.887-0.376-0.887 c0.088-0.323,0.898-1.135,1.316-1.554c1.223-1.21,2.548-2.805,3.83-4.348c0.607-0.731,1.215-1.463,1.812-2.153 c1.86-2.164,2.688-3.844,3.648-5.79l0.503-1.011c2.344-4.657,0.342-8.587-0.305-9.856c-0.531-1.062-10.012-23.944-11.02-26.348 c-2.424-5.801-5.627-8.502-10.078-8.502c-0.413,0,0,0-1.732,0.073c-2.109,0.089-13.594,1.601-18.672,4.802 c-5.385,3.395-14.495,14.217-14.495,33.249c0,17.129,10.87,33.302,15.537,39.453c0.116,0.155,0.329,0.47,0.638,0.922 c17.873,26.102,40.154,45.446,62.741,54.469c21.745,8.686,32.042,9.69,37.896,9.69c0.001,0,0.001,0,0.001,0 c2.46,0,4.429-0.193,6.166-0.364l1.102-0.105c7.512-0.666,24.02-9.22,27.775-19.655c2.958-8.219,3.738-17.199,1.77-20.458 C233.168,179.508,230.845,178.393,227.904,176.981z"></path> <path id="XMLID_470_" d="M156.734,0C73.318,0,5.454,67.354,5.454,150.143c0,26.777,7.166,52.988,20.741,75.928L0.212,302.716 c-0.484,1.429-0.124,3.009,0.933,4.085C1.908,307.58,2.943,308,4,308c0.405,0,0.813-0.061,1.211-0.188l79.92-25.396 c21.87,11.685,46.588,17.853,71.604,17.853C240.143,300.27,308,232.923,308,150.143C308,67.354,240.143,0,156.734,0z M156.734,268.994c-23.539,0-46.338-6.797-65.936-19.657c-0.659-0.433-1.424-0.655-2.194-0.655c-0.407,0-0.815,0.062-1.212,0.188 l-40.035,12.726l12.924-38.129c0.418-1.234,0.209-2.595-0.561-3.647c-14.924-20.392-22.813-44.485-22.813-69.677 c0-65.543,53.754-118.867,119.826-118.867c66.064,0,119.812,53.324,119.812,118.867 C276.546,215.678,222.799,268.994,156.734,268.994z"></path> </g> </g></svg>
`;

const queue = new FunctionQueue();

const RouteScreen = (props: Props) => {
  const navigation = useNavigation();
  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [modalContent, setModalContent] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const {Navigator, Screen} = createBottomTabNavigator();
  const [nextPointDrive, setNextPointDrive] = React.useState(false);
  const propsParams = props?.route?.params;
  const uid = propsParams.uid;
  const uidPoint = propsParams.uidPoint;
  const typePoint = propsParams.type;
  const goBack = () => {
    navigation.goBack({post: true});
  };

  /*React.useEffect(() => {
    setPending(false);
  }, []);*/

  // React.useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     mutate();
  //   });

  //   return unsubscribe;
  // }, [navigation]);

  useEffect(() => {
    // Подписка на изменения состояния сети
    const unsubscribe = NetInfo.addEventListener(state => {
      //console.log('NetInfo', { state })
      if (state.isConnected) {
        //console.log('Сеть восстановлена');

        queue.processQueue(); // Запускаем очередь при восстановлении сети
      }
    });

    return () => {
      unsubscribe(); // Отменяем подписку при размонтировании компонента
    };
  }, []);

  const {
    data: route,
    isLoading,
    mutate,
    error,
  } = useCachedSWR(`/route/${uid}`, () =>
    getReq(`/route/${uid}`).then(res => res.data),
  );

  console.log("HJHJHJHJ", route)

  // if (error && (!route || !route?.points)) {
  //   mutate(`/route/${uid}`, getCachedData(`/route/${uid}`), false); // Возвращаем кэшированные данные
  // }

  const updateDate = async (data: any, callback = () => {}) => {
    const netInfo = await NetInfo.fetch();

    mutate((currentData: any) => {
      const updatedData = {...currentData};
      const point = updatedData.points.find(p => p.uidPoint === data.uidPoint);

      if (point) {
        switch (data.type) {
          case 5:
            point.status = 1;
            orders.find(order => order.type === 1).status = 1; // Прибытие на точку
            break;
          case 6:
            point.status = 3;
            break;
          default:
            const order = point.orders.find(
              o => o.uidOrder === data.uidOrder && o.type === data.type,
            );
            if (order) {
              order.date = data.date;
              handleOrderStatus(point, order);
            }
            break;
        }
      }

      return updatedData;
    }, false);

    const callbackFunc = async () => {
      await callback(); // Ждем завершения колбэка
    };

    if (!netInfo.isConnected) {
      data.needJSON = false;
      queue.enqueue(callbackFunc); // Добавляем в очередь, если нет сети
    } else {
      // Здесь мы вызываем callbackFunc без await, так как это не обязательно
      callbackFunc(); // Выполняем колбэк, если есть сеть
    }

    setPending(false); // Устанавливаем pending в false
  };

  const handleOrderStatus = (point, order) => {
    if (point.point === 1) {
      // Это Склад
      if (order.type === 1) {
        point.status = 2;
        orders.find(o => o.type === 2).status = 2; // ТС Загружено
      } else if (order.type === 2) {
        orders.find(o => o.type === 3).status = 2; // Закрывающие документы получены
      } else if (order.type === 7) {
        point.status = 2; // Возврат на склад
      }
      order.status = 3;
    } else {
      if (order.type === 1) {
        order.status = 3;
        point.status = 2;
        point.orders.forEach(o => {
          if (o.status === 0) o.status = 1;
        });
      } else {
        order.status = 3;
      }
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    mutate();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  //const [points, setPoints] = React.useState(route?.points);

  const points = route?.points || [];
  const point = find(points, {uidPoint: uidPoint});
  const orders = point?.orders;
  const params = {
    ...route,
    orders,
    uidPoint,
    points,
  };

  let sortedOrders = orders;

  console.log(JSON.stringify(orders));
  if (point?.status === 2) {
    sortedOrders = orders.sort((a, b) => {
      // Сначала сортируем по status (возрастание)
      if (a.status !== b.status) {
        return a.status - b.status; // Возрастание
      }
    });
  }

  useEffect(() => {
    //console.log("point", JSON.stringify(point));
    //-- Гоним на склад
    /*if (point.point === 1 && point.type === 1) {
      console.log({point});
      addGeofenceToNextPoint(point);
    }*/
    // Обработка событий геозон
    /*const geofenceEventListener = BackgroundGeolocation.onGeofence((geofence) => {
      Alert.alert('Вы подъехали к точке!');
  
      BackgroundGeolocation.removeGeofence(point.uidPoint);
      geofenceEventListener.remove()
    });*/
    // Получение текущих геозон
    /*BackgroundGeolocation.getGeofences().then((geofences) => {
      console.log('[getGeofences] ', geofences);
      
  
      //BackgroundGeolocation.removeGeofence(geofences);
  
    }).catch((error) => {
      console.log('[getGeofences] FAILURE: ', error);
    });*/
    /*return () => {
      // Очистка при размонтировании компонента
      BackgroundGeolocation.removeGeofence("MyGeofence");
      geofenceEventListener.remove();
    };*/
  }, []);

  // ---------- Открытие модального окна происшествия ----------

  const [visibleAccident, setVisibleAccident] = React.useState(false);

  const handleCloseAccidentModal = () => {
    setVisibleAccident(false);
  };

  // ---------- Открытие навигатора ----------

  const handleOpenNavigator = async params => {
    const url = `yandexnavi://build_route_on_map?lat_to=${params.lat}&lon_to=${params.lon}`;

    openAddressOnMap('', params.lat, params.lon);

    // const supportedYa = await Linking.canOpenURL(url)
    //   .then(supported => supported)
    //   .catch(err => Alert.alert('Ошибка', err.toString()));
    const supportedGoogleMaps = await Linking.canOpenURL(urlAndroidMap)
      .then(supported => supported)
      .catch(err => Alert.alert('Ошибка', err.toString()));

    // if (supportedYa) {
    //   Linking.openURL(url);

    //   return;
    // }

    if (supportedGoogleMaps) {
      Linking.openURL(urlAndroidMap);

      return;
    }

    // Alert.alert('Ошибка', 'Пожалуйста, установите Яндекс Навигатор или ');
  };

  const onSelect = index => {
    setSelectedIndex(index);
  };

  // ---------- Верхняя карточка ----------

  const renderMainCard = params => {
    const currentPoint = params?.status === 1 || params?.status === 2;
    const buttonShipment = checkButtonShipment();
    //const LoginKey = localStorage.getItem('LoginKey');
    //console.log({LoginKey});
    const AllowAllShipments = true;

    return (
      <Layout>
        {currentPoint && (
          <Text category="label" style={styles.titleList}>
            <Icon
              name="corner-right-down-outline"
              width={20}
              height={20}
              style={styles.textHeaderCardIcon}></Icon>
            Текущая точка следования
          </Text>
        )}

        <Card
          status={currentPoint ? 'danger' : 'success'}
          header={renderMainCardHeader(params)}
          footer={renderMainCardFooter(params)}
          style={[
            styles.containerCards,
            (currentPoint && {borderWidth: 1, borderColor: '#FF3D72'}) || {
              borderWidth: 1,
              borderColor: '#91F2D2',
            },
          ]}>
          {renderMainCardButtons(params)}
        </Card>

        {renderNextPointCard()}

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginRight: 5,
          }}>
          <View>
            <Text category="label" style={styles.titleList}>
              <Icon
                name="flash-outline"
                width={20}
                height={20}
                style={styles.textHeaderCardIcon}></Icon>
              Действия
            </Text>
          </View>

          {buttonShipment && AllowAllShipments && (
            <View>
              <Button
                size="small"
                accessoryLeft={<Icon name="checkmark-square-2-outline" />}
                onPress={() => handleAlertShipmantAllOrders()}>
                Отгрузить
              </Button>
            </View>
          )}
        </View>
      </Layout>
    );
  };

  const handleAlertShipmantAllOrders = () => {
    Alert.alert('Отгрузить заказы?', 'Будут отгружены все заказы без заданий', [
      {
        text: 'Отмена',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'Отгрузить', onPress: () => handleShipmantAllOrders()},
    ]);
  };

  const handleShipmantAllOrders = () => {
    const filteredOrders = point.orders.filter(
      order =>
        order.type === 4 && order.status === 2 && order.tasks.length === 0,
    );

    if (filteredOrders.length > 0) {
      filteredOrders.forEach(order => {
        putTimeCardToServer(order);
      });
    }
  };

  const checkButtonShipment = () => {
    let buttonShipment = false;

    allComplete = point?.orders?.every(order => order.status === 3);

    //console.log("orders", JSON.stringify(point));

    //console.log("orders", JSON.stringify(orders));
    if (
      point?.point === 0 &&
      point?.status == 2 &&
      orders?.length > 1 &&
      !allComplete
    ) {
      buttonShipment = true;
    }

    return buttonShipment;
  };

  const renderMainCardHeader = item => {
    return (
      <Layout style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
        <View style={styles.textHeaderCard}>
          <Icon
            name="pin-outline"
            width={23}
            height={23}
            style={styles.textHeaderCardIcon}></Icon>
          <Text category="h6" style={styles.textHeaderCard}>
            {item?.address}
          </Text>
        </View>
      </Layout>
    );
  };

  const renderMainCardButtons = item => {
    const telegram = route?.telegram;
    const whatsapp = route?.whatsapp;

    return (
      <ButtonGroup
        selectedIndex={selectedIndex}
        e
        onSelect={onSelect}
        style={{flex: 1, justifyContent: 'space-between', flexDirection: 'row'}}
        appearance="outline"
        status="control"
        size="medium">
        <Button
          key={1}
          onPress={() => openPhoneWithNumber('79222965859')}
          accessoryLeft={<Icon name="phone" />}
          style={{backgroundColor: '#0088cc', marginRight: 0, flex: 1}}
        />
        <Button
          key={2}
          onPress={() => openTelegramWithNumber(telegram)}
          accessoryLeft={<SvgXml xml={telegramXml} width={20} height={20} />}
          style={{backgroundColor: '#0088cc', marginRight: 0, flex: 1}}
        />
        <Button
          key={3}
          onPress={() => openWhatsAppWithNumber(whatsapp)}
          accessoryLeft={<SvgXml xml={whatsappXml} width={20} height={20} />}
          style={{backgroundColor: '#43d854', marginRight: 0, flex: 1}}
        />
        <Button
          key={4}
          onPress={() => setVisibleAccident(true)}
          accessoryLeft={<Icon name="alert-circle" />}
          style={{backgroundColor: '#B00000', marginRight: 0, flex: 1}}
        />
      </ButtonGroup>
    );
  };

  const openTelegramWithNumber = phoneNumber => {
    Linking.openURL(`https://t.me/${phoneNumber}`);
  };

  const openWhatsAppWithNumber = phoneNumber => {
    Linking.openURL(`https://wa.me/${phoneNumber}`);
  };

  const openPhoneWithNumber = phoneNumber => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // ---------- Кнопки ----------

  const renderButtonStartPoint = () => {
    hasStartedPoint = points.some(
      item => item.status === 1 || item.status === 2,
    );

    return (
      (!hasStartedPoint && (
        <View>
          <Button
            style={{}}
            accessoryLeft={<Icon name="corner-up-right-outline"></Icon>}
            onPress={startCurrentPoint}>
            Начать следование
          </Button>
        </View>
      )) || (
        <View>
          <Button
            style={{}}
            accessoryLeft={<Icon {...props} name="clock-outline" />}
            appearance="outline"
            status="warning"
            onPress={{}}>
            В следовании другая точка
          </Button>
        </View>
      )
    );
  };

  const renderButtonOpenNavigator = params => {
    return (
      <View>
        <Button
          style={{}}
          accessoryLeft={<Icon name="compass-outline" />}
          onPress={() => handleOpenNavigator(params)}>
          Открыть в навигаторе
        </Button>
      </View>
    );
  };

  const renderButtonFinishPoint = () => {
    return (
      !nextPointDrive && (
        <View>
          <Button
            style={{}}
            onPress={finishCurrentPoint}
            accessoryLeft={<Icon name="flag" />}>
            Завершить точку
          </Button>
        </View>
      )
    );
  };

  const renderButtonCompletePoint = () => {
    return (
      <View>
        <Button
          style={{}}
          appearance="outline"
          status="success"
          accessoryLeft={<Icon name="checkmark-circle-2-outline" />}
          onPress={() =>
            Alert.alert(
              'Точка завершена в ' + point.time_fact + ' / ' + point.date_fact,
            )
          }>
          Точка завершена
        </Button>
      </View>
    );
  };

  const renderMainCardFooter = (params = {}) => {
    allOrderFinished =
      !!params.orders && params.orders.every(order => order.status === 3);

    if (params.point === 0) {
      //-- ЭтоТочка
      if (params.status === 0) {
        return renderButtonStartPoint();
      } else if (params.status === 1) {
        return renderButtonOpenNavigator(params);
      } else if (params.status === 2 && allOrderFinished) {
        return renderButtonFinishPoint();
      } else if (params.status === 3) {
        return renderButtonCompletePoint();
      }
    } else if (params.point === 1) {
      //-- ЭтоСклад
      if (params.status === 0) {
        return renderButtonStartPoint();
      } else if (params.status === 1) {
        return renderButtonOpenNavigator(params);
      } else if (params.status === 2 && allOrderFinished) {
        return renderButtonFinishPoint();
      } else if (params.status === 3) {
        return renderButtonCompletePoint();
      }
    }
  };

  // ---------- Карточка следующая точка ----------

  function findNextPoint() {
    if (!Array.isArray(points)) {
      return false;
    }

    console.log('point.type', point.type);
    console.log({typePoint});

    const sortedPoints = points?.sort((a, b) => a.sort - b.sort);
    const currentIndex = sortedPoints.findIndex(
      point =>
        point?.uidPoint === uidPoint &&
        point?.type === typePoint &&
        point?.status === 3,
    );

    console.log({currentIndex});

    const nextPoint = sortedPoints.find((point, index) => index > currentIndex);

    return nextPoint || false;
  }

  const renderNextPointCard = () => {
    const nextPoint = findNextPoint();
    const allPointsFinished = points.some(item => item.status === 0);
    const pointStatus = point.status === 3;

    return (
      (!allPointsFinished && !nextPoint && pointStatus && (
        <Layout>
          <Text category="label" style={styles.titleList}>
            <Icon
              name="flag-outline"
              width={20}
              height={20}
              style={styles.textHeaderCardIcon}></Icon>
            Все точки завершены
          </Text>
          <Card status="success" style={styles.containerCards}>
            <View>
              <Button
                style={{}}
                appearance="outline"
                status="primary"
                accessoryLeft={<Icon name="arrow-back-outline" />}
                onPress={() => goBack()}>
                Вернуться
              </Button>
            </View>
          </Card>
        </Layout>
      )) ||
      (allPointsFinished && nextPoint && nextPointDrive && (
        <Layout>
          <Text category="label" style={styles.titleList}>
            <Icon
              name="corner-up-right-outline"
              width={20}
              height={20}
              style={styles.textHeaderCardIcon}></Icon>
            Следующая точка
          </Text>
          <Card
            status="primary"
            style={styles.containerCards}
            header={renderNextPointCardHeader(nextPoint)}
            footer={renderNextPointCardFooter(nextPoint)}>
            <View style={styles.textBodyCardWithLeftView}>
              <View style={styles.textTimeLeft}>
                <Layout>
                  <Text
                    category="s1"
                    style={{
                      textAlign: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0)',
                    }}>
                    {nextPoint?.time}
                  </Text>
                </Layout>
                <Layout>
                  <Text
                    category="c2"
                    style={{
                      textAlign: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0)',
                    }}>
                    {nextPoint?.date}
                  </Text>
                </Layout>
              </View>
              {renderNextPointCardText(nextPoint)}
            </View>
          </Card>
        </Layout>
      ))
    );
  };

  const renderNextPointCardText = nextPoint => {
    const showAddress =
      nextPoint && nextPoint.address !== nextPoint.client_name;
    const returnWarehouse = nextPoint.type == 7; //-- 7 это склад

    if (returnWarehouse) {
      return (
        <View style={styles.containerCardText}>
          <Text category="c2">Точка завершения Маршрута</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.containerCardText}>
          {showAddress && (
            <Text category="c2">Адрес: {nextPoint?.address}</Text>
          )}
          <Text category="c2">Объем: {nextPoint?.volume}, м3</Text>
          <Text category="c2">Вес: {nextPoint?.weight}, кг</Text>
          <Text category="c2">
            Количество заказов: {nextPoint?.countOrders}
          </Text>
          {/*<Text category="c2">
        Загрузка: {item?.loading}, %
      </Text>*/}
        </View>
      );
    }
  };

  const renderNextPointCardHeader = nextPoint => (
    <Layout style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
      <View style={styles.textHeaderCard}>
        <Icon
          name="pin-outline"
          width={23}
          height={23}
          style={styles.textHeaderCardIcon}></Icon>
        <Text category="h6" style={styles.textHeaderCard}>
          {nextPoint?.address}
        </Text>
      </View>
    </Layout>
  );

  const renderNextPointCardFooter = nextPoint => (
    <View>
      <Button
        style={{}}
        accessoryLeft={<Icon name="corner-up-right-outline"></Icon>}
        onPress={() => startNextPoint(nextPoint)}>
        Начать следование
      </Button>
    </View>
  );

  // ---------- Карточки заказов ----------

  const footerModal = item => (
    <Layout style={{}} level="1">
      <Button
        style={styles.buttonModal}
        status="primary"
        accessoryLeft={<Icon name="checkmark-square-outline" />}
        onPress={() => putTimeCardToServer(item)}>
        Зафиксировать
      </Button>
    </Layout>
  );

  const shouldShowAlert = (params, item, orderWithType1AndNotStatus3) => {
    return (
      params.status === 0 || (item.status !== 1 && orderWithType1AndNotStatus3)
    );
  };

  const shouldShowTimeFixedAlert = item => {
    return item.tasks.length === 0 && item.status === 3;
  };

  const shouldShowTimeNotFixedModal = (item, visible) => {
    return item.tasks.length === 0 && item.status < 3 && !visible;
  };

  const onPressCardOrder = (item, props, uidPoint) => {
    const orderWithType1AndNotStatus3 = params.orders.find(
      order => order.type === 1 && order.status !== 3,
    );

    if (shouldShowAlert(params, item, orderWithType1AndNotStatus3)) {
      Alert.alert('Необходимо начать следование или зафиксировать прибытие');
      return;
    }

    if (shouldShowTimeFixedAlert(item)) {
      Alert.alert('Время зафиксировано');
    } else if (shouldShowTimeNotFixedModal(item, visible)) {
      setModalContent(
        <Card
          style={{padding: 5}}
          disabled={true}
          status="danger"
          footer={footerModal(item)}>
          <Text category="s1">Необходимо зафиксировать время</Text>

          <Text category="h6">{item.name}</Text>
        </Card>,
      );
      setVisible(true);
    } else {
      props.navigation.navigate('TaskOrderScreen', {...item, uidPoint});
    }
  };

  const renderCardOrder = ({
    item,
    index,
  }: {
    item: RouterListItem;
    index: number;
  }): React.ReactElement => {
    currentAction = item.status === 1;
    currentActionOrder = item.status === 2;
    finishedAction = item.status === 3;

    return (
      <Card
        style={[
          styles.containerCards,
          (currentAction && {borderWidth: 1, borderColor: '#0092FF'}) ||
            (finishedAction && {borderWidth: 1, borderColor: '#91F2D2'}) ||
            (currentActionOrder && {borderWidth: 1, borderColor: '#FFAA00'}),
        ]}
        status={getCardStatus(item.status)}
        header={() => renderCardOrderName(item)}
        onPress={() => onPressCardOrder(item)}>
        {renderCardOrderText(item)}
      </Card>
    );
  };

  const renderCardOrderText = item => {
    const typeName = item.type !== 1 ? 'Время прибытия:' : 'Время фиксации:';
    const formattedDate =
      item.type !== 4 && getToggleCardStatus(item)
        ? getDateFromJSON(item.date)
        : null;

    let content;
    if (item.type !== 4) {
      if (formattedDate) {
        content = (
          <Text category="c2">
            {typeName} {formattedDate}
          </Text>
        );
      } else {
        content = <Text category="c2">Необходимо зафиксировать время</Text>;
      }
    } else {
      content = (
        <>
          <Text category="c2">Объем = {`${item.weight}`}</Text>
          <Text category="c2">Вес = {`${item.volume}`}</Text>
        </>
      );
    }

    return (
      <Layout style={styles.textBodyCardWithLeftView}>
        <Toggle
          checked={getToggleCardStatus(item)}
          onChange={() => onPressCardOrder(item)}></Toggle>
        <View style={styles.containerCardText}>{content}</View>
      </Layout>
    );
  };

  const renderCardOrderName = (item: RouterListItem) => {
    const hasTasks = item.tasks.length !== 0;

    return (
      <View style={styles.textHeaderCardOrder}>
        <View style={styles.textHeaderCard}>
          {renderCardOrderIcon(item.type)}

          <Text
            category="label"
            style={{
              flex: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              fontSize: 14,
            }}>
            {item.name}
          </Text>
        </View>

        {hasTasks && (
          <Icon
            name="bulb-outline"
            width={24}
            height={24}
            style={{color: 'red'}}
          />
        )}
      </View>
    );
  };

  const renderCardOrderIcon = type => {
    const iconNames = {
      1: 'compass-outline',
      2: 'download-outline',
      3: 'file-text-outline',
      4: 'bookmark-outline',
    };

    const iconName = iconNames[type] || 'file-outline';

    return (
      <Icon
        name={iconName}
        width={23}
        height={23}
        style={styles.textHeaderCardIcon}
      />
    );
  };

  // ---------- Запросы к серверу ----------

  const startNextPoint = async item => {
    setPending(true);

    await new Promise(resolve => setTimeout(resolve, 0));

    let data = getDataPostRoute();
    data.screen = 2;
    data.type = 5;
    data.point = item.point;
    data.uidPoint = item.uidPoint;

    updateDate(data, async () => {
      //console.log('AAAa');
      const dataString = JSON.stringify(data);

      await postRoute(uid, dataString);

      await addGeofenceToNextPoint(item);

      props.navigation.navigate('TaskScreen', {...item});

      mutate();

      setNextPointDrive(false);

      //setPending(false);
    });
  };

  const startCurrentPoint = async () => {
    setPending(true);

    await new Promise(resolve => setTimeout(resolve, 0));

    let data = getDataPostRoute();
    data.screen = 2;
    data.type = 5;
    data.point = point.point;
    data.uidPoint = point.uidPoint;

    updateDate(data, async () => {
      //console.log('bbbbb');
      const dataString = JSON.stringify(data);
      await postRoute(uid, dataString);

      await addGeofenceToNextPoint(point);

      mutate();

      //setPending(false);
    });
  };

  const finishCurrentPoint = async () => {
    setPending(true);

    await new Promise(resolve => setTimeout(resolve, 0));

    let data = getDataPostRoute();
    data.screen = 2;
    data.type = 6;
    data.point = point.point;
    data.uidPoint = point.uidPoint;

    updateDate(data, async () => {
      //console.log('ccccc');
      const dataString = JSON.stringify(data);
      await postRoute(uid, dataString);

      setNextPointDrive(true);

      mutate();

      //setPending(false);
    });
  };

  const putTimeCardToServer = async item => {
    setVisible(false);

    setPending(true);

    await new Promise(resolve => setTimeout(resolve, 0));

    let data = getDataPostRoute();
    data.screen = 2;
    data.type = item.type;
    data.point = point.point;
    data.uidPoint = point.uidPoint;
    data.uidOrder = item.uidOrder;

    updateDate(data, async () => {
      //console.log('DDDD');
      const dataString = JSON.stringify(data);
      await postRoute(uid, dataString);

      mutate();

      //setPending(false);
    });
  };

  // ---------- Модальное окно ----------

  const renderModalWindow = () => {
    return (
      <Modal
        visible={visible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setVisible(false)}>
        {modalContent}
      </Modal>
    );
  };

  const TasksScreen = () => (
    <SafeAreaView style={{flex: 1}}>
      {pending && (
        <View style={styles.spinnerContainer}>
          <Spinner size="giant" />
        </View>
      )}
      <List
        style={{
          minHeight: '100%',
        }}
        data={sortedOrders}
        ListHeaderComponent={renderMainCard(point)}
        renderItem={renderCardOrder}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      />

      {renderModalWindow()}

      <AccidentScreen
        visibleAccident={visibleAccident}
        onClose={handleCloseAccidentModal}
        uidPoint={uidPoint}
        uid={uid}
      />
    </SafeAreaView>
  );

  // ---------- Фотографии ----------

  const PhotoScreen = () => {
    if (point.status !== 0) {
      return (
        <SafeAreaView style={{flex: 1}}>
          <Layout>
            <ScrollView contentContainerStyle={styles.wrap}>
              <Text category="label" style={styles.titleList}>
                <Icon
                  name="camera-outline"
                  width={20}
                  height={20}
                  style={styles.textHeaderCardIcon}></Icon>
                Добавить фото
              </Text>
              <AddPhoto {...props} />
            </ScrollView>
          </Layout>
        </SafeAreaView>
      );
    } else {
      return (
        <SafeAreaView style={{flex: 1}}>
          <Card style={styles.containerCard}>
            <Text category="label" style={styles.titleList}>
              <Icon
                name="alert-circle-outline"
                width={20}
                height={20}
                style={styles.textHeaderCardIcon}></Icon>
              Фотографии можно сделать только на активном маршруте
            </Text>
          </Card>
        </SafeAreaView>
      );
    }
  };

  const TabNavigator = () => (
    <Navigator tabBar={props => <BottomTabBar {...props} />}>
      <Screen
        name="Действия"
        component={TasksScreen}
        options={{headerShown: false}}
      />
      <Screen
        name="Фото"
        component={PhotoScreen}
        options={{headerShown: false}}
      />
    </Navigator>
  );

  const BottomTabBar = ({navigation, state}) => (
    <BottomNavigation
      selectedIndex={state.index}
      onSelect={index => navigation.navigate(state.routeNames[index])}>
      <BottomNavigationTab
        title="Задачи"
        icon={<Icon {...props} name="bookmark-outline" />}
      />
      <BottomNavigationTab
        title="Фото"
        icon={<Icon {...props} name="camera-outline" />}
      />
    </BottomNavigation>
  );


  if (!route) {
    return null;
  }
  // ---------- Отрисовка ----------
  return (
    <NavigationContainer independent={true}>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default RouteScreen;
