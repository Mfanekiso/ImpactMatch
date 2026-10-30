import AsyncStorage from "@react-native-async-storage/async-storage";

const keyFor = (uid) => `impact-match-profile:${uid}`;

export async function cacheProfile(uid, profile) {
  if (!uid || !profile) return;
  try {
    await AsyncStorage.setItem(keyFor(uid), JSON.stringify(profile));
  } catch (error) {
    console.warn("Could not cache profile:", error?.message);
  }
}

export async function readCachedProfile(uid) {
  if (!uid) return null;
  try {
    const value = await AsyncStorage.getItem(keyFor(uid));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn("Could not read cached profile:", error?.message);
    return null;
  }
}

export async function writeLocalCache(key, value) {
  try { await AsyncStorage.setItem(`impact-match-cache:${key}`, JSON.stringify(value)); }
  catch (error) { console.warn("Could not cache app data:", error?.message); }
}

export async function readLocalCache(key) {
  try {
    const value = await AsyncStorage.getItem(`impact-match-cache:${key}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn("Could not read cached app data:", error?.message);
    return null;
  }
}
