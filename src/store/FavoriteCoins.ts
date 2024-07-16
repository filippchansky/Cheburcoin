import { create } from 'zustand';
import { auth, db } from '../../configs/firebase/config';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

interface State {
  coins: string[] | null;
  // setCoins: (value: string) => void;
  addCoins: () => void;
}

export const useFavoriteCoins = create<State>((set) => ({
  coins: null,
  // setCoins: (value) => set((state) => ({ coins: { ...state.coins, value } })),
  addCoins: async () => {
    await getDocs(collection(db, 'users')).then((res) => {
      set({
        coins: res.docs.find((item) => item.id === auth.currentUser?.uid)?.data().coinList
      });
    });
  }
}));
