import { create } from "zustand";
import { auth, db } from "../../configs/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface State {
  coins: string[];
  setCoins: (value: string) => void;
  addCoins: () => void;
}

export const useFavoriteCoins = create<State>((set) => ({
  coins: [],
  setCoins: (value) => set((state) => ({ coins: { ...state.coins, value } })),
  addCoins: async () => {
    if (auth.currentUser) {
      console.log('store')
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log(docSnap.data().coinList, 'store')
        set({coins: docSnap.data().coinList})
      }
    }
  },
}));
