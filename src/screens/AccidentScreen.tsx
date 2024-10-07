import React, { useState, useEffect } from 'react';
import { Button, Layout, Text, Input, RadioGroup, Radio, Card, Modal, Icon, Spinner } from '@ui-kitten/components';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getDataPostRoute } from '../components/functions.js';
import { postRoute } from '../api/routes';
import NetInfo from '@react-native-community/netinfo';
import FunctionQueue from '../utils/FunctionQueue.js';
import { View } from 'react-native';
import { styles } from '../styles';
import { useFunctionQueue } from '../store/FunctionQueueContext.js';



const AccidentScreen = ({ visibleAccident, onClose, uidPoint, uid }) => {
  const queue = useFunctionQueue();
  const [text, setText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pending, setPending] = useState(false);

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

  const options = [
    'Неоплата по прибытии',
    'Техническая неисправность ТС в пути следования',
    'Задерживаюсь на погрузке/выгрузке',
    'Пробка на дороге/Движение затруднено',
    'Контактное лицо на точке выгрузки не отвечает',
    'При погрузке/выгрузке выявлен некондиционный товар',
    'Другое',
  ];

  const displayValue = options[selectedIndex];

  const handleSubmit = async () => {
    setPending(true);

    const payload = displayValue === 'Другое' ? text : displayValue;

    let data = getDataPostRoute();
    data.screen = 4;
    data.accident = payload;
    data.uidPoint = uidPoint;

    updateDate(data, async () => {
      //console.log('AAAa');
      const dataString = JSON.stringify(data);

      await postRoute(uid, dataString);
    });
  };

  const updateDate = async (data: any, callback = () => { }) => {
    const netInfo = await NetInfo.fetch();
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
    onClose();
  };

  const renderCardHeader = () => (
    <Layout style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <Icon name="alert-triangle-outline" width={23} height={23} />
      <Text category="h6" style={{ marginLeft: 5 }}>Сообщить о происшествии</Text>
    </Layout>
  );

  const renderCardFooter = () => (
    <Layout level="1">
      <Layout style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 10 }}>
        <Button
          appearance="filled"
          onPress={handleSubmit}
          style={{ flex: 1 }}
          accessoryLeft={<Icon name='checkmark-square-outline' />}
        >
          Подтвердить
        </Button>
      </Layout>
    </Layout>
  );

  return (
    <Modal
      visible={visibleAccident}
      backdropStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onBackdropPress={() => onClose()}
    >
      {pending && (
        <View style={styles.spinnerContainer}>
          <Spinner size="giant" />
        </View>
      )}
      <Card
        style={{ margin: 20, borderWidth: 1, borderColor: "#FF3D72"}}
        status='danger'
        header={renderCardHeader}
        footer={renderCardFooter}
      >
        {displayValue === 'Другое' && (
          <KeyboardAwareScrollView>
            <Input
              multiline
              placeholder="Другое"
              label="Другое"
              value={text}
              onChangeText={setText}
              textStyle={{ minHeight: 64 }}
            />
          </KeyboardAwareScrollView>
        )}

        <RadioGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          {options.map((option, index) => (
            <Radio key={index}>{option}</Radio>
          ))}
        </RadioGroup>
      </Card>
    </Modal>
  );
};

export default AccidentScreen;
