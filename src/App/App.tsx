import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Button,
  NativeModules,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export default function App() {
  const watchPosition = () => {
    try {
      const watchID = Geolocation.watchPosition(
        position => {
          console.log(position);
          setPosition(JSON.stringify(position));
        },
        error => Alert.alert('WatchPosition Error', JSON.stringify(error)),
        {
          interval: 500,
          distanceFilter: 0,
        },
      );
      setSubscriptionId(watchID);
    } catch (error) {
      Alert.alert('WatchPosition Error', JSON.stringify(error));
    }
  };

  const clearWatch = () => {
    subscriptionId !== null && Geolocation.clearWatch(subscriptionId);
    setSubscriptionId(null);
    setPosition(null);
  };

  const [position, setPosition] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  useEffect(() => {
    return () => {
      clearWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStartBtnPress = async () => {
    NativeModules.BackgroundWorkManager.startBackgroundWork();
  };
  const onCancelBtnPress = async () => {
    NativeModules.BackgroundWorkManager.stopBackgroundWork();
  };

  return (
    <View>
      <Text>
        <Text style={styles.title}>Last position: </Text>
        {position || 'unknown'}
      </Text>
      {subscriptionId !== null ? (
        <Button title="Clear Watch" onPress={clearWatch} />
      ) : (
        <Button title="Watch Position" onPress={watchPosition} />
      )}

      <Button title="startBackgroundWork " onPress={onStartBtnPress} />
      <Button title="onCancelBtnPress " onPress={onCancelBtnPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '500',
  },
});
