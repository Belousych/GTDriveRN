// ---------- Страница Текущий маршрут ----------

/* eslint-disable react/no-unstable-nested-components */
import map_scripts from '../map_scripts';
import useSWR from 'swr';
import { Layout, List, Text, Button, Card, Icon, BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import React, { useEffect, useContext, useRef, useCallback } from 'react';
import { View, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { postRoute, getOSRM } from '../api/routes';
import { RouterListItem } from '../types';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { GlobalState } from '../store/global/global.state';
import { getCardStatus, getDataPostRoute } from '../components/functions.js';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { styles } from '../styles';
import { UserContext } from '../store/user/UserProvider';
import { getRequest } from '../api/request';

type Props = {};

const RouteScreen = (props: Props) => {
  
  const [pending, setPending] = React.useState(true);
  const context = useContext(GlobalState);
  const { currentRoute, setRoute } = useContext(UserContext);
  const { location } = useContext(GlobalState);
  const Map_Ref = useRef(null);
  const lat = location?.coords?.latitude;
  const lon = location?.coords?.longitude;
  const { Navigator, Screen } = createBottomTabNavigator();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);
  const goBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    setPending(false);
  }, []);



  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      mutate();
    });

    return unsubscribe;
  }, [navigation]);

  const uid = props?.route?.params?.uid;
  const {
    data: route,
    isLoading,
    mutate,
    error,
  } = useSWR(`/route/${uid}`, getRequest);


  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    mutate();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const routeItem = route;

  if (error || !routeItem) {
    return null;
  }

  let points = routeItem?.points;
  points = [...points].sort((a, b) => a.sort - b.sort);

  // ---------- Карточки Маршрута Доставки ----------

  const renderMainCard = () => {
    const currenRoute = routeItem.status === 1 && routeItem.check;

    return (
      <Layout>
        {currenRoute &&
          <Text category="label" style={styles.titleList}>
            <Icon name="corner-right-down-outline" width={20} height={20} style={styles.textHeaderCardIcon}></Icon>
            Текущий маршрут
          </Text>
        }

        <Card
          status='danger'
          header={renderMainCardHeader()}
          footer={renderMainCardFooter()}
          style={{...styles.containerCards, borderWidth: 1, borderColor: "#FF3D72"}}
        >
          <Text category="c2">
            Объем: {routeItem?.volume}, м3
          </Text>
          <Text category="c2">
            Вес: {routeItem?.weight}, кг
          </Text>
          {/*<Text category="c2">
            Загрузка: {routeItem?.loading} %
          </Text>*/}
        </Card>
      </Layout>
    )
  }

  const renderMainCardHeader = () => {
    return (
      <Layout>
        <View style={styles.textHeaderCardRoute}>
          <Icon name="car-outline" width={23} height={23} style={styles.textHeaderCardIcon}></Icon>
          <Text category="h6">{routeItem?.name}</Text>

          {renderMainCardReturnToWarehouse()}
        </View>
      </Layout>
    )
  }

  const renderMainCardFooter = () => {
    allPointsFinished = points.every(point => point.status === 3);

    if (!routeItem.check && !allPointsFinished) {
      const otherRoute = currentRoute && (currentRoute !== uid);
      const buttonText = otherRoute ? 'В работе другой маршрут' : 'Начать Маршрут';
      const buttonIcon = otherRoute ? 'stop-circle' : 'flag';
      const buttonDisabled = pending || otherRoute;

      return (
        <View>
          <Button
            onPress={getThisRoute}
            disabled={buttonDisabled}
            //accessoryLeft={pending ? Loader : () => <Icon {...props} name={buttonIcon} />}
            style={{}}
          >
            {buttonText}
          </Button>
        </View>
      );
    } else if (allPointsFinished && routeItem.check && routeItem.status !== 3){
      return (
        <View>
          <Button
            onPress={finishThisRoute}
            accessoryLeft={<Icon {...props} name='flag-outline' />}
            style={{}}
          >
            Завершить маршрут
          </Button>
        </View>
      ) 
    } else if (routeItem.status === 3){ 
      return (
        <Button
          style={{}}
          appearance="outline"
          status="success"
          accessoryLeft={<Icon name="checkmark-circle-2-outline" />}
        >
          Маршрут завершен
        </Button>
      ) 
    }
  };

  const renderMainCardReturnToWarehouse = () => {
    if (routeItem.returnToWarehouse) {
      return (
        <View style={{}}>
          <Icon name="swap" width={23} height={23} style={{ marginRight: 5 }} onPress={() => { Alert.alert("Требуется возврат на склад!") }}  ></Icon>
        </View>
      )
    } else {
      return (
        <View style={{}}>
          <Icon name="arrow-forward" width={23} height={23} style={{ marginRight: 5 }} onPress={() => { Alert.alert("Возврат на склад не требуется!") }}  ></Icon>
        </View>
      )
    }
  }

  // ---------- Карточки точек доставки ----------

  const renderCardsPoint = ({ item, index }: { item: RouterListItem; index: number; }): React.ReactElement => { 
    const statusFirstPoint = points[0].status === 0;
    const isCurrentPoint = (item.status === 1 || item.status === 2) && routeItem.check;
    const isRoutePoint = !isCurrentPoint && ((index === 1 && !statusFirstPoint) || (index === 0 && statusFirstPoint));
    const finishedPoint = item.status === 3;
  
    return (
      <Layout>
        {isCurrentPoint && (
          <Text category="label" style={styles.titleList}>
            <Icon name="navigation" width={20} height={20} style={styles.textHeaderCardIcon}></Icon>
            Текущая точка следования
          </Text>
        )}
  
        {isRoutePoint && (
          <Text category="label" style={styles.titleList}>
            <Icon name="navigation-2" width={20} height={20} style={styles.textHeaderCardIcon}></Icon>
            Точки Маршрута
          </Text>
        )}
  
        <Card
          style={[styles.containerCards,
            isCurrentPoint && { borderWidth: 1, borderColor: "#0092FF"} ||
            finishedPoint && { borderWidth: 1, borderColor: "#91F2D2"} 
          ]}
          status={getCardStatus(item.status)}
          header={() => renderCardPointName(item)}
          onPress={() => handleOpenTaskScreen(item)}
        >
          {renderCardPointText(item)}
        </Card>
      </Layout>
    );
  };


const handleOpenTaskScreen = item => {
  if (!routeItem.check) {
    Alert.alert("Необходимо принять маршрут");
  } else {
    props.navigation.navigate('TaskScreen', { ...item, ...points })
  }
}

const renderCardPointText = (item: RouterListItem) => {
  return (
    <View style={styles.textBodyCardWithLeftView}>
      {renderCardPointTextLeft(item)}

      {item.type === 1 || item.type === 7 ? renderWarehouseText(item) : renderPointText(item)}
    </View>
  );
};

const renderWarehouseText = (item: RouterListItem) => (
  <View style={styles.containerCardText}>
    <Text category="c2">
      {item.type === 1 ? "Точка погрузки машины на складе" : "Точка завершения маршрута"}
    </Text>
  </View>
);

const renderPointText = (item: RouterListItem) => {
  const showAddress = item.address !== item.client_name;

  return (
    <View style={styles.containerCardText}>
      {showAddress &&
        <Text category="c2">
          Адрес: {item?.address}
        </Text>
      }
      <Text category="c2">
        Объем: {item?.volume}, м3
      </Text>
      <Text category="c2">
        Вес: {item?.weight}, кг
      </Text>
      <Text category="c2">
        Количество заказов: {item?.countOrders}
      </Text>  
      {/*<Text category="c2">
          Загрузка: {item?.loading}, %
    </Text>*/}
    </View>
  )
};

const renderCardPointTextLeft = (item: RouterListItem) => {
  return (
    <View style={styles.textTimeLeft}>
      <Layout>
        <Text category="s1" style={{ textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0)' }}>
          {item?.time}
        </Text>
      </Layout>
      <Layout>
        <Text category="c2" style={{ textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0)' }}>
          {item?.date}
        </Text>
      </Layout>
    </View>
  );
};

const renderCardPointName = (item: RouterListItem) => {
  return (
    <Layout style={styles.textHeaderCard}>
      {renderCardPointNameIcon(item)}

      <Text category='label' style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', fontSize: 14 }}>
        {item?.client_name}
      </Text>
    </Layout>
  );
};

const renderCardPointNameIcon = item => (
  <Icon
    name={item.point === 1 ? "download-outline" : "pin-outline"}
    width={23}
    height={23}
    style={{ margin: 10 }}
  />
);

// ---------- Таб Точки ----------

const PointsScreen = () => (
  <SafeAreaView>
    <List
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      style={{
        minHeight: '100%',
      }}
      data={points}
      renderItem={renderCardsPoint}
      ListHeaderComponent={renderMainCard}
    />
  </SafeAreaView>
);

// ---------- Таб Карты ----------

const calculateMapData = async () => {
  let mapData = [];
  let pointNumber = 0;
  let coordinates = [];

  points.forEach(point => {
    let color = 'grey';

    switch (point.status) {
      case 0:
        color = 'blue';
        break;
      case 1:
        color = 'green';
        break;
      case 2:
        color = 'red';
        break;
      default:
        color = 'grey';
        break;
    };

    const bindText = {
      address: point.address,
      name: point.client_name,
      count: point.orders.length,
      plan: point.time + " / " + point.date, 
      fact: point.time_fact + " / " + point.date_fact
    }

    const dataPoint = {
      lat: point.lat,
      lon: point.lon,
      color: color,
      bindText: point.address
    };

    if (point.status !== 3) {
      pointNumber++;
      dataPoint.number = pointNumber;
    } else {
      dataPoint.number = "";
    }

    if (point.status === 3) {
      mapData.unshift(dataPoint);
    } else {
      mapData.push(dataPoint);
    }
  });

  coordinates = points
    .filter(point => point.status !== 3 && point.lat && point.lon)
    .map(point => `${point.lon},${point.lat}`);

  if (lon && lat) {
    coordinates.unshift(`${lon},${lat}`);
  }

  const osrmData = await getOSRM(coordinates);

  const mapDataWithCoordinates = {
    points: mapData,
    coordinates: osrmData
  };

  return mapDataWithCoordinates;
};

const MapOSRMScreen = () => (
  <WebView
    ref={Map_Ref}
    source={{ html: map_scripts }}
    style={styles.Webview}
    onLoad={() => this.jsMapInit(lat, lon)}
  />
);

jsMapInit = async (lat, lon) => {
  const dataPoints = await calculateMapData();

  if (Map_Ref.current) {
    Map_Ref.current.injectJavaScript(`init(${lat}, ${lon});`);
    Map_Ref.current.injectJavaScript(
      `renderPoints(${JSON.stringify(dataPoints)})`,
    );
  }
};

// ---------- Запросы к серверу ----------

const getThisRoute = async () => {
  context.enableGeo();

  let data = getDataPostRoute();
  data.screen = 0;
  data.type = 5;
  data.uid = uid;

  data = JSON.stringify(data);

  await postRoute(uid, data);

  mutate();
};

const finishThisRoute = async () => {
  context.disableGeo(); 
  setRoute(null);

  let data = getDataPostRoute();
  data.screen = 0;
  data.type = 5;
  data.uid = uid;
  data.finish = true;

  data = JSON.stringify(data);

  await postRoute(uid, data);

  goBack();

  //mutate();
};

// ---------- Табы ----------

const TabNavigator = () => (
  <Navigator tabBar={props => <BottomTabBar {...props} />}>
    <Screen
      name='Точки'
      component={PointsScreen}
      options={{ headerShown: false }}
    />
    <Screen
      name='Карта'
      component={MapOSRMScreen}
      options={{ headerShown: false }}
    />
  </Navigator>
);

const BottomTabBar = ({ navigation, state }) => (
  <SafeAreaView>
    <BottomNavigation
      selectedIndex={state.index}
      onSelect={index => navigation.navigate(state.routeNames[index])}>

      <BottomNavigationTab
        title='Точки'
        icon={<Icon {...props} name='pin' />}
      />

      <BottomNavigationTab
        title='Карта'
        icon={<Icon {...props} name='globe' />}
      />

    </BottomNavigation>
  </SafeAreaView>
);

return (
  <NavigationContainer independent={true}>
    <TabNavigator />
  </NavigationContainer>
);
};

export default RouteScreen;
