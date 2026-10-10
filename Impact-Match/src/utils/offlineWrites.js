import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../Backend/firebaseConfig";

const QUEUE_KEY = "impact-match:pending-firestore-writes";
let flushing = false;

async function readQueue() {
  try { return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || "[]"); }
  catch { return []; }
}

async function writeQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function writeFirestoreOrQueue(collectionName, documentId, data) {
  const item = { collectionName, documentId, data };
  const network = await NetInfo.fetch();
  if (network.isConnected === false || network.isInternetReachable === false) {
    const queue = await readQueue();
    queue.push(item);
    await writeQueue(queue);
    return { queued: true };
  }

  try {
    await setDoc(doc(db, collectionName, documentId), data, { merge: true });
    return { queued: false };
  } catch (error) {
    if (error?.code && !["unavailable", "deadline-exceeded", "network-request-failed"].includes(error.code.replace("firestore/", ""))) throw error;
    const queue = await readQueue();
    queue.push(item);
    await writeQueue(queue);
    return { queued: true };
  }
}

export async function flushOfflineWrites() {
  if (flushing) return;
  const network = await NetInfo.fetch();
  if (network.isConnected === false || network.isInternetReachable === false) return;
  const queue = await readQueue();
  if (!queue.length) return;
  flushing = true;
  const remaining = [];
  try {
    for (const item of queue) {
      try {
        await setDoc(doc(db, item.collectionName, item.documentId), item.data, { merge: true });
      } catch {
        remaining.push(item);
      }
    }
    await writeQueue(remaining);
  } finally {
    flushing = false;
  }
}
