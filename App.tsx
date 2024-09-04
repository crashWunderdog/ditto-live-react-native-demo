import React, {useEffect, useState} from 'react';
import {
  PermissionsAndroid,
  SafeAreaView,
  View,
  Text,
  Button,
} from 'react-native';

import {useDitto} from './ditto';
import {CounterDocument, mockCounterDocument} from './ditto.helpers';

function App(): React.JSX.Element {
  const {
    isDittoReady,
    documents,
    deleteDocuments,
    updateDocument,
    printNetworkDetails,
  } = useDitto();
  const [value, setValue] = useState(0);

  async function requestPermissions() {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    Object.entries(granted).forEach(([permission, result]) => {
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        console.log(`${permission} granted`);
      } else {
        console.log(`${permission} denied`);
      }
    });
  }

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    console.log('documents', documents);
    setValue(documents[0]?.value || 0);
  }, [documents]);

  if (!isDittoReady) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center'}}>
      <InsertDocument
        onPress={() =>
          updateDocument({...mockCounterDocument, value: value + 1})
        }
      />
      <ListDocuments documents={documents} />
      <DeleteDocuments
        deleteDocuments={deleteDocuments}
        printNetworkDetails={printNetworkDetails}
      />
    </SafeAreaView>
  );
}

const InsertDocument = ({onPress}: {onPress: () => void}) => {
  return (
    <View>
      <Button onPress={onPress} title="increase" />
    </View>
  );
};

const ListDocuments = ({documents}: {documents: CounterDocument[]}) => {
  return (
    <View style={{marginVertical: 32, justifyContent: 'center'}}>
      {documents.length === 0 && <Text>No documents...</Text>}
      {documents.map((doc: CounterDocument) => (
        <Text key={doc.id}>Value is: {doc.value}</Text>
      ))}
    </View>
  );
};

const DeleteDocuments = ({
  deleteDocuments,
  printNetworkDetails,
}: {
  deleteDocuments: () => void;
  printNetworkDetails: () => void;
}) => {
  return (
    <View>
      <Button onPress={deleteDocuments} title="Clear" color={'red'} />
      <View style={{marginTop: 16}}>
        <Button
          onPress={printNetworkDetails}
          title="Print connection details"
          color={'green'}
        />
      </View>
    </View>
  );
};

export default App;
