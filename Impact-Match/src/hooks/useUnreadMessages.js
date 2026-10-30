import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../Backend/firebaseConfig";

export default function useUnreadMessages() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setCount(0);
      return undefined;
    }
    const conversations = query(
      collection(db, "conversations"),
      where("participants", "array-contains", uid)
    );
    return onSnapshot(conversations, (snapshot) => {
      const total = snapshot.docs.reduce(
        (sum, item) => sum + (Number(item.data().unreadCount?.[uid]) || 0),
        0
      );
      setCount(total);
    }, (error) => console.warn("Could not update unread message badge:", error?.message));
  }, []);

  return count;
}
