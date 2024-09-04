import {
  DittoError,
  Ditto,
  type Identity,
  TransportConfig,
  QueryResult,
  QueryResultItem,
  StoreObserver,
  DocumentID,
} from '@dittolive/ditto';
import {Platform} from 'react-native';
import {config} from './config';
import {useCallback, useEffect, useState} from 'react';
import {CounterDocument, COLLECTION_NAME} from './ditto.helpers';

const identity: Identity = config;

let ditto: Ditto;

export const initDitto = async () => {
  if (ditto) {
    return ditto;
  }
  try {
    ditto = new Ditto(identity);
  } catch (error: any) {
    if (error instanceof DittoError) {
      // handle errors starting Ditto
      console.error('Error starting Ditto:', error);
    }
    throw error;
  }

  const transportsConfig = new TransportConfig();
  transportsConfig.global.syncGroup = 1337;

  transportsConfig.peerToPeer.bluetoothLE.isEnabled = true;
  transportsConfig.peerToPeer.lan.isEnabled = true;
  transportsConfig.peerToPeer.lan.isMdnsEnabled = true;
  // Apple Wireless Direct Link is only available on Apple devices
  transportsConfig.peerToPeer.awdl.isEnabled = Platform.OS === 'ios';

  try {
    ditto.smallPeerInfo.isEnabled = true;
    ditto.setTransportConfig(transportsConfig);
    ditto.startSync();
  } catch (error: any) {
    console.error('Error starting Ditto sync:', error);
  }

  return ditto;
};

export const useDitto = () => {
  const [dittoInstance, setDittoInstance] = useState<Ditto | null>(null);
  const [documents, setDocuments] = useState<CounterDocument[]>([]);

  const startDitto = async () => {
    const ditto = await initDitto();
    setDittoInstance(ditto);
  };

  const createDocumentsSubscription = useCallback(() => {
    if (!dittoInstance) {
      console.error('Ditto instance not initialized!');
      return;
    }
    console.log('registering subscription');
    dittoInstance.sync.registerSubscription(`SELECT * FROM ${COLLECTION_NAME}`);
    dittoInstance.store.registerObserver(
      `SELECT * FROM ${COLLECTION_NAME}`,
      (response: QueryResult) => {
        const parsedDocuments = response.items.map((doc: QueryResultItem) => {
          return doc.value;
        });
        console.log('HERE ARE THE UPDATED DOCUMENTS', parsedDocuments);
        setDocuments(parsedDocuments);
      },
    );
  }, [dittoInstance]);

  const printNetworkDetails = useCallback(async () => {
    if (!dittoInstance) {
      return;
    }
    const syncScope = await dittoInstance.smallPeerInfo.getSyncScope();
    console.log('syncScope', syncScope);
    console.log('Connection graph:', dittoInstance.presence.graph);
    console.log("Metadata:" ,dittoInstance.presence.peerMetadataJSONString);
  }, [dittoInstance]);



  useEffect(() => {
    startDitto();
  }, []);

  useEffect(() => {
    if (dittoInstance) {
      createDocumentsSubscription();
    }
  }, [dittoInstance]);

  const deleteDocuments = useCallback(async () => {
    if (!dittoInstance) {
      return;
    }
    try {
      // Cancel all active subscriptions
      dittoInstance.sync.subscriptions.forEach(subscription => {
        subscription.cancel();
      });

      // Cancel all active observers
      dittoInstance.store.observers.forEach((observer: StoreObserver) => {
        observer.cancel();
      });

      // Clear the remote store

      // Clear the local store
      await dittoInstance.store.execute(`EVICT FROM ${COLLECTION_NAME}`);

      // Re-register the subscription
      createDocumentsSubscription();
    } catch (error: any) {
      console.error('Error deleting documents:', error);
    }
  }, [dittoInstance]);

  const updateDocument = useCallback(
    async (doc: CounterDocument) => {
      if (!dittoInstance) {
        return;
      }
      console.log('updating document', doc);
      const queryResult = await dittoInstance.store.execute(
        `INSERT INTO ${COLLECTION_NAME} DOCUMENTS (:document) ON ID CONFLICT DO UPDATE`,
        {document: {...doc}},
      );
      console.log(
        'queryResult',
        queryResult.items.map((item: QueryResultItem) => item.value),
      );
      console.log(
        'mutated',
        queryResult
          .mutatedDocumentIDs()
          .map((docId: DocumentID) => docId.value),
      );
    },
    [dittoInstance],
  );

  return {
    isDittoReady: !!dittoInstance,
    documents,
    deleteDocuments,
    updateDocument,
    printNetworkDetails,
  };
};
