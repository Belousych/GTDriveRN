import React, {useContext, useEffect} from 'react';
import BackgroundGeolocation from 'react-native-background-geolocation';
import {getDevTokens, getTokens} from '../api/auth';
import {getBaseUrl} from '../api/axios';
import {GlobalState} from '../store/global/global.state';
import {UserContext} from '../store/user/UserProvider';
import {Alert} from 'react-native';
import { Platform, ToastAndroid } from 'react-native';

function useGeolocation(enabledGeo) {
  const context = React.useContext(GlobalState);
  const [location, setLocation] = React.useState('');
  const [enabled, setEnabled] = React.useState(enabledGeo);
  const {currentUser, currentRoute} = useContext(UserContext);

  console.log('enabledGeo', enabledGeo);

  useEffect(() => {
    setEnabled(enabledGeo);
  }, [enabledGeo]);

  let Logger = BackgroundGeolocation.logger;

  React.useEffect(() => {
    if (!currentUser && !currentRoute) {
      return;
    }

    /// 1.  Subscribe to events.
    const onLocation: Subscription = BackgroundGeolocation.onLocation((location) => {
        Logger.debug('Location received in Javascript: ' + location.uuid);

        //console.log({location});

        context.setLocation(location);
      },
    );

    const onHttp: Subscription = BackgroundGeolocation.onHttp(httpEvent => {
      console.log('[http] ', httpEvent.success, httpEvent.status);
    });

    const onMotionChange: Subscription = BackgroundGeolocation.onMotionChange(
      event => {
        console.log('[onMotionChange]', event);
      },
    );

    const onActivityChange: Subscription =
      BackgroundGeolocation.onActivityChange(event => {
        console.log('[onActivityChange]', event);
      });

    const onProviderChange: Subscription =
      BackgroundGeolocation.onProviderChange(event => {
        console.log('[onProviderChange]', event);

        BackgroundGeolocation.setConfig({
          params: {
            // <-- Optional HTTP params
            user: {
              uid: currentUser,
              uidRoute: currentRoute,
            },
            provider: {gps: event?.gps, network: event?.network},
          },
        });
      });

    const onAuthorization: Subscription = BackgroundGeolocation.onAuthorization(
      event => {
        if (event.success) {
          console.log('[authorization] ERROR: ', event.error);
        } else {
          console.log('[authorization] SUCCESS: ', event.response);
        }
      },
    );

    const onGeofence: Subscription = BackgroundGeolocation.onGeofence(
      async (geofenceEvent) => {
        if (geofenceEvent.action === 'ENTER') {
          //if (Platform.OS === 'android') {
          //  ToastAndroid.show(`Вы подъезжаете на точку!`, ToastAndroid.SHORT);
          //} else {
            setTimeout(() => {
              Alert.alert(`Вы подъезжаете на точку!`);
            }, 5000); // Задержка 500 мс
          //}

          try {
            // Удаляем геозону
            await BackgroundGeolocation.removeGeofence(geofenceEvent.identifier);
            
            console.log(`Геозона с идентификатором ${geofenceEvent.identifier} удалена`);
          } catch (error) {
            console.log('Ошибка при удалении геозоны:', error);
          }
        }
      }
    );

    const init = async () => {
      const baseUrl = await getBaseUrl();
      const {token} = await getTokens();

      const tokenDev = await getDevTokens({isRefresh: false});

      let providerState = await BackgroundGeolocation.getProviderState();
      console.log('- Provider state: ', providerState);

      /// 2. ready the plugin.
      BackgroundGeolocation.ready({
        // Geolocation Config
        enabled: false,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10, //-- Расстояние при котором идет отсылка координат между точками A и B
        interval: 5000,
        // Activity Recognition
        stopTimeout: 5,
        // Application config
        debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
        logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
        stopOnTerminate: true, // <-- Allow the background-service to continue tracking when user closes the app.
        startOnBoot: true, // <-- Auto start tracking when device is powered-up. default = true
        // HTTP / SQLite config
        url: `${baseUrl}/geo_info_users`,
        // url: `http://localhost:3000/geo_info_users`,
        locationTemplate:
          '{"coords":{"latitude":"<%= latitude %>","longitude":"<%= longitude %>","accuracy":"<%= accuracy %>","speed":"<%= speed %>"},"battery":{"level":"<%= battery.level %>","is_charging":"<%= battery.is_charging %>"},"timestamp":"<%= timestamp %>","uuid":"<%= uuid %>","event":"<%= event %>","is_moving":"<%= is_moving %>","odometer":"<%= odometer %>"}',
        method: 'PUT',
        batchSync: false, // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
        autoSync: true, // <-- [Default: true] Set true to sync each location to server as it arrives.
        authorization: {
          strategy: 'JWT',
          accessToken: tokenDev,
          expires: 10,
        },
        params: {
          // <-- Optional HTTP params
          user: {
            uid: currentUser,
            uidRoute: currentRoute,
          },
          provider: {
            gps: providerState?.gps,
            network: providerState?.network,
          },
        },
        desiredOdometerAccuracy: 10, //-- точность выброса, по умолчанию = 100
        elasticityMultiplier: 0.5 //--  величение elasticityMultiplier приведет к небольшому количеству выборок местоположений по мере увеличения скорости. По-умолчанию 1
        //geofenceProximityRadius: 300 //-- радиус геозоны
      })
        .then(state => {
          setEnabled(state.enabled);
          console.log(
            '- BackgroundGeolocation is configured and ready: ',
            state.enabled,
          );
        })
        .catch(err => {
          console.error(err);
        });
    };

    init();

    return () => {
      // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
      // during development live-reload.  Without this, event-listeners will accumulate with
      // each refresh during live-reload.
      onLocation.remove();
      onHttp.remove();
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
      onAuthorization.remove();
    };
  }, [currentUser, currentRoute]);

  /// 3. start / stop BackgroundGeolocation
  React.useEffect(() => {
    if (enabled) {
      BackgroundGeolocation.start();
      BackgroundGeolocation.destroyTransistorAuthorizationToken();
      BackgroundGeolocation.destroyLocations(); // TODO удалить потом
    } else {
      BackgroundGeolocation.stop();
      setLocation('');
    }
  }, [enabled]);

  return {};
}

export default useGeolocation;
