import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AdminUser {
  email: string;
  name: string;
  role: "admin";
}

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
}

const ADMIN_USER_KEY = "vfh_admin_user";
const ADMIN_TOKEN_KEY = "vfh_admin_token";

function loadFromStorage(): AdminAuthState {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const user = localStorage.getItem(ADMIN_USER_KEY);
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return {
      user: user ? (JSON.parse(user) as AdminUser) : null,
      token,
    };
  } catch {
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    return { user: null, token: null };
  }
}

const initialState: AdminAuthState = loadFromStorage();

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdmin(state, action: PayloadAction<{ user: AdminUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(action.payload.user));
        localStorage.setItem(ADMIN_TOKEN_KEY, action.payload.token);
      }
    },
    clearAdmin(state) {
      state.user = null;
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(ADMIN_USER_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    },
  },
});

export const { setAdmin, clearAdmin } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
