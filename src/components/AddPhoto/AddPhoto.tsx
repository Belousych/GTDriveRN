import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Icon, Layout } from '@ui-kitten/components';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageBackground, View } from 'react-native';
import { acceptImages } from '../../api/photo';
import { getDataPostRoute } from '../functions.js';

// Отдельный блок стилей
const styles = {
  imageContainer: {
    margin: 2,
  },
  imageBackground: {
    height: 150,
    width: 150,
    overflow: 'hidden',
    borderColor: 'rgba(0, 0, 0, 0)',
    borderWidth: 1,
  },
  cardLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLayout: {
    bottom: 0,
    margin: 5
  },
};

const AddPhoto = (props) => {
  const [images, setImages] = useState([]);
  const params = props?.route?.params;
  const uid = params?.uid;
  const uidOrder = params?.uidOrder;
  const uidPoint = params?.uidPoint;
  const uidPointOrder = uidOrder ? uidOrder : uidPoint;

  useEffect(() => {
    getSavedPhotos();
  }, []);

  const getSavedPhotos = async () => {
    try {
      const savedPhotos = await AsyncStorage.getItem('savedPhotos_' + uidPointOrder);

      savedPhotos && setImages(JSON.parse(savedPhotos));
    } catch (error) {
      console.error('Error getting saved photos:', error);
    }
  };

  const savePhotos = async (photosToSave) => {
    try {
      await AsyncStorage.setItem('savedPhotos_' + uidPointOrder, JSON.stringify(photosToSave));
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const onImagePress = (response) => {
    if (!response.didCancel) {
      const newImages = [...images, { ...response, uploaded: false }];

      setImages(newImages);
      savePhotos(newImages);
    }
  };

  const launchImagePicker = useCallback((options) => {
    launchImageLibrary(options, onImagePress);
  }, [images]);

  const launchCameraPicker = useCallback(() => {
    const options = {
      saveToPhotos: true,
      mediaType: 'photo',
      includeBase64: true,
      selectionLimit: 10,
      maxWidth: 2560,
      maxHeight: 1440,
    };

    launchCamera(options, onImagePress);
  }, [images]);

  const removeNewImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const onSubmitPhoto = async () => {
    let data = getDataPostRoute();
    data.screen = 3;
    data.uid = uid;
    data.uidPoint = uidPoint;

    if (uidOrder !== "Undefined") {
      data.uidOrder = uidOrder;
    }

    // Отправляем только новые фотографии на сервер
    //const newImages = images.filter(image => !image.uploaded);
    // Предположим, что у новых фотографий свойство "uploaded" равно false
    //data.images = newImages.map(image => image.assets[0].base64);

    data.images = images;
    data = JSON.stringify(data);

    await acceptImages(data);

    // Пометить отправленные фотографии как загруженные
    const updatedImages = images.map(image => {
      if (newImages.includes(image)) {
        return { ...image, uploaded: true };
      }
      return image;
    });

    savePhotos(updatedImages);

    setImages(updatedImages);
  };

  const CameraIcon = (props): IconElement => (
    <Icon {...props} name="camera-outline" />
  );

  const SyncIcon = (props): IconElement => (
    <Icon {...props} name="sync-outline" />
  );

  const ImageIcon = (props): IconElement => (
    <Icon {...props} name="image-outline" />
  );

  const TrashIcon = (props): IconElement => (
    <Icon {...props} name="trash-2-outline" />
  );

  const renderCardHeader = () => (
    <Layout style={styles.headerLayout}>
      <Button
        accessoryLeft={ImageIcon}
        onPress={() => launchImagePicker({ selectionLimit: 1, mediaType: 'photo', includeBase64: true })}
        status='primary'
        style={{ flex: 1, margin: 4 }}>
        Галерея
      </Button>
      <Button
        accessoryLeft={CameraIcon}
        onPress={launchCameraPicker}
        status='success' style={{ flex: 1, margin: 4 }}>
        Камера
      </Button>
    </Layout>
  );

  const renderCardFooter = () => {

    images.map((image, index) => (
      console.log(image.uploaded)
    ))

    const hasUnuploadedPhotos = images.some(image => !image.uploaded);

    return hasUnuploadedPhotos ? (
      <Layout style={styles.footerLayout}>
        <Button
          accessoryLeft={SyncIcon}
          onPress={onSubmitPhoto}>
          Отправить фото
        </Button>
      </Layout>
    ) : null;
  };



  return (
    <Card
      style={styles.cardLayout}
      header={renderCardHeader}
      footer={renderCardFooter}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {images.map((image, index) => (
          <View
            style={styles.imageContainer}
            key={index}
          >
            <ImageBackground
              style={styles.imageBackground}
              source={{ uri: image.assets[0].uri }} />

            {!image.uploaded && <Button accessoryLeft={TrashIcon} onPress={() => removeNewImage(index)}>Удалить</Button>}
          </View>
        ))}
      </View>
    </Card>
  );
};

export default AddPhoto;