import { configureStore } from "@reduxjs/toolkit";
import adminAuthReducer from "./adminAuthSlice";
import userAuthReducer from "./userAuthSlice";

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    userAuth: userAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
