import React from 'react';
import 'react-native-gesture-handler';

import {IconRegistry} from '@ui-kitten/components';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import GeoBackgroundg from './src/components/GeoBackgroundg';
import MainNavigation from './src/components/MainNavigation';
import CombinedContextProviders from './src/store/CombinedContextProviders';

import NetInfo from '@react-native-community/netinfo';

import {AppState} from 'react-native';
import {SWRConfig} from 'swr';

function App(): JSX.Element {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        isVisible: () => {
          return true;
        },
        initFocus(callback) {
          let appState = AppState.currentState;

          const onAppStateChange = (nextAppState: any) => {
            /* Если оно переходит из фонового или неактивного режима в активный */
            if (
              appState.match(/inactive|background/) &&
              nextAppState === 'active'
            ) {
              callback();
            }
            appState = nextAppState;
          };

          // Подпишитесь на события изменения состояния приложения
          const subscription = AppState.addEventListener(
            'change',
            onAppStateChange,
          );

          return () => {
            subscription.remove();
          };
        },
        initReconnect(callback) {
          const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
              callback(); // Триггер перезапроса данных при подключении сети
            }
          });

          return () => {
            unsubscribe();
          };
        },
      }}>
      <CombinedContextProviders>
        <GeoBackgroundg />
        <IconRegistry icons={EvaIconsPack} />
        <MainNavigation />
      </CombinedContextProviders>
    </SWRConfig>
  );
}

export default App;
