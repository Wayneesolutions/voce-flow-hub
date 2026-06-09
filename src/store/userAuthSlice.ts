import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ClientUser {
  email: string;
  name: string;
  role: "user";
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
}

interface UserAuthState {
  user: ClientUser | null;
  token: string | null;
  tenant: TenantInfo | null;
}

const USER_KEY = "vfh_user";
const TOKEN_KEY = "vfh_token";
const TENANT_KEY = "vfh_tenant";

function loadFromStorage(): UserAuthState {
  if (typeof window === "undefined") return { user: null, token: null, tenant: null };
  try {
    const user = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    const tenant = localStorage.getItem(TENANT_KEY);
    return {
      user: user ? (JSON.parse(user) as ClientUser) : null,
      token,
      tenant: tenant ? (JSON.parse(tenant) as TenantInfo) : null,
    };
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TENANT_KEY);
    return { user: null, token: null, tenant: null };
  }
}

const initialState: UserAuthState = loadFromStorage();

const userAuthSlice = createSlice({
  name: "userAuth",
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{ user: ClientUser; token: string; tenant?: TenantInfo }>,
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.tenant = action.payload.tenant ?? null;
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        if (action.payload.tenant) {
          localStorage.setItem(TENANT_KEY, JSON.stringify(action.payload.tenant));
        }
      }
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.tenant = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TENANT_KEY);
      }
    },
  },
});

export const { setUser, clearUser } = userAuthSlice.actions;
export default userAuthSlice.reducer;
