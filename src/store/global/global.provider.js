import {ApplicationProvider} from '@ui-kitten/components';
import {useEffect, useMemo, useReducer, useState} from 'react';
import RNFS from 'react-native-fs';

import React from 'react';
import {Alert, PermissionsAndroid, Platform, Linking} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

import {globalActionTypes as actions} from './global.actions';
import {globalReducer} from './global.reducer';
import {GlobalState} from './global.state';

import * as eva from '@eva-design/eva';
import {getUpdate} from '../../api/routes';
import compareVersions from '../../utils/compareVersions';
import {appVersion} from '../../version';

const GLOBAL_STATE = {
  isLoggedIn: undefined,
  theme: 'light',
  isModalOpen: false,
  enabledGeo: false,
  location: null,
};

export const GlobalStateProvider = ({children}) => {
  const [state, dispatch] = useReducer(globalReducer, GLOBAL_STATE);

  const [showInstaller, setShowInstaller] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  console.log({updateData});

  useEffect(() => {
    const init = async () => {
      getUpdate()
        .then(data => {
          setUpdateData(data);

          if (compareVersions(appVersion, data.version) < 0) {
            setShowInstaller(true);
          }
        })
        .catch(error => {
          console.error(error);
        });
    };

    init();
  }, []);

  async function requestStoragePermission() {
    try {
      // if (Number(Platform.Version) >= 33) {

      //   return true;
      // }

      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

      const hasPermission = await PermissionsAndroid.check(permission);
      if (hasPermission) {
        return true;
      }

      const granted = await PermissionsAndroid.request(permission, {
        title: 'Storage Permission Required',
        message:
          'App needs access to your storage to download and install the update.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        console.log('Camera permission denied');
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log("Camera permission denied and don't ask again selected");
        // openAppSettings();
        Alert.alert(
          'Permission needed',
          'To use this feature, you need to grant camera permission from settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => openAppSettings()},
          ],
        );
      }
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  const openAppSettings = () => {
    Linking.openSettings().catch(() => {
      console.warn('Cannot open settings');
    });
  };

  async function downloadAndInstallAPK() {
    const url = updateData.link;
    console.log('Downloading APK...', {updateData});
    // Linking.openURL(url); // TODO раскомментировать чтобы просто через хром закачать
    // return


    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'You need to give storage permission to download the update.',
      );
      return;
    }

    

    const fileName = url.split('/').pop();
    const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    RNFS.downloadFile({
      fromUrl: url,
      toFile: destPath,
    })
      .promise.then(async res => {
        if (res.statusCode === 200) {
          Alert.alert(
            'Download Complete',
            'The APK has been downloaded. Do you want to install it now?',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Install', onPress: () => installAPK(destPath)},
            ],
            {cancelable: false},
          );
        } else {
          Alert.alert('Download Failed', 'Failed to download the APK.');
        }
      })
      .catch(err => {
        console.error(err);
        Alert.alert(
          'Download Error',
          'An error occurred while downloading the APK.',
        );
      });
  }

  function installAPK(filePath) {
    Linking.openURL(`file://${filePath}`);
  }

  const value = useMemo(
    () => ({
      ...state,
      login: () => {
        dispatch({type: actions.LOGIN});
      },
      logout: () => {
        dispatch({type: actions.DISABLE_GEO});
        dispatch({type: actions.LOGOUT});
      },
      setLightTheme: () => {
        dispatch({type: actions.LIGHT_THEME});
      },
      setDarkTheme: () => {
        dispatch({type: actions.DARK_THEME});
      },
      openModal: () => {
        dispatch({type: actions.OPEN_MODAL});
      },
      closeModal: () => {
        dispatch({type: actions.CLOSE_MODAL});
      },
      enableGeo: () => {
        dispatch({type: actions.ENABLE_GEO});
      },
      disableGeo: () => {
        dispatch({type: actions.DISABLE_GEO});
      },
      setLocation: location => {
        dispatch({type: actions.SET_LOCATION, payload: location});
      },
    }),
    [state, dispatch],
  );

  const {theme} = state;

  // Wrap the context provider around our component
  return (
    <ApplicationProvider {...eva} theme={eva[theme]}>
      <GlobalState.Provider
        value={{
          ...value,
          showInstaller,
          updateData,
          downloadAndInstallAPK,
        }}>
        {children}
      </GlobalState.Provider>
    </ApplicationProvider>
  );
};
