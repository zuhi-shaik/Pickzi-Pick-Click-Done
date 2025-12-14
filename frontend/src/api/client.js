   const API_BASE = process.env.REACT_APP_API || 'http://localhost:5000';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

let token = null;
let user = null;
let sessionLoaded = false;

const dispatchSessionEvent = () => {
  try {
    if (typeof window !== 'undefined') {
      const ev = new CustomEvent('auth_token_changed', { detail: { token: token || null, user } });
      window.dispatchEvent(ev);
    }
  } catch {}
};

const persistSession = () => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}

  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
};

const ensureSessionLoaded = () => {
  if (sessionLoaded) return;
  sessionLoaded = true;
  if (typeof window === 'undefined') {
    token = token || null;
    user = user || null;
    return;
  }

  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    token = storedToken || null;
  } catch {
    token = token || null;
  }

  try {
    const storedUser = localStorage.getItem(USER_KEY);
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }
};

export const setSession = ({ token: nextToken = null, user: nextUser = null } = {}) => {
  token = nextToken || null;
  user = nextUser || null;
  sessionLoaded = true;
  persistSession();
  dispatchSessionEvent();
  return { token, user };
};

export const setToken = (t) => setSession({ token: t, user });

export const setUser = (nextUser) => setSession({ token, user: nextUser });

export const loadToken = () => {
  ensureSessionLoaded();
  return token;
};

export const loadUser = () => {
  ensureSessionLoaded();
  return user;
};

export async function api(path, { method = 'GET', body, headers } = {}) {
  const h = { 'Content-Type': 'application/json', ...(headers || {}) };
  if (token == null) loadToken();
  if (token) h['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = isJson && data && data.message ? data.message : res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data;
}

export const ProductsAPI = {
  list: (params) => {
    const q = params && params.category ? `?category=${encodeURIComponent(params.category)}` : '';
    return api(`/api/products${q}`);
  },
  get: (id) => api(`/api/products/${id}`),
  create: (payload) => api('/api/products', { method: 'POST', body: payload }),
  update: (id, payload) => api(`/api/products/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => api(`/api/products/${id}`, { method: 'DELETE' }),
};

export const AuthAPI = {
  register: async (payload) => {
    // Registration should not create an authenticated session.
    // Backend returns a message and `needsEmailVerification` flag so that
    // the client can navigate to the email OTP verification screen.
    const resp = await api('/api/users/register', { method: 'POST', body: payload });
    return resp;
  },
  login: async (payload) => {
    const resp = await api('/api/users/login', { method: 'POST', body: payload });
    if (resp?.token || resp?.user) {
      setSession({ token: resp.token || null, user: resp.user || null });
    }
    return resp;
  },
  logout: () => setSession({ token: null, user: null }),
};

export const ChatAPI = {
  send: (messages) => api('/api/chat', { method: 'POST', body: { messages } }),
};

export const AddressAPI = {
  get: () => api('/api/users/me/address'),
  save: (payload) => api('/api/users/me/address', { method: 'PUT', body: payload })
};

export const CartAPI = {
  get: () => api('/api/users/me/cart'),
  upsert: ({ productId, quantity = 1, size }) =>
    api('/api/users/me/cart', { method: 'POST', body: { productId, quantity, size } }),
  patch: ({ productId, delta, size }) =>
    api('/api/users/me/cart', { method: 'PATCH', body: { productId, delta, size } }),
  remove: (productId, size) => {
    const suffix = size ? `?size=${encodeURIComponent(size)}` : '';
    return api(`/api/users/me/cart/${productId}${suffix}`, { method: 'DELETE' });
  },
  clear: () => api('/api/users/me/cart', { method: 'DELETE' }),
};

export const WishlistAPI = {
  get: () => api('/api/users/me/wishlist'),
  add: ({ productId, size = '' }) =>
    api('/api/users/me/wishlist', { method: 'POST', body: { productId, size } }),
  remove: (productId, size = '') => {
    const suffix = size ? `?size=${encodeURIComponent(size)}` : '';
    return api(`/api/users/me/wishlist/${productId}${suffix}`, { method: 'DELETE' });
  },
  clear: () => api('/api/users/me/wishlist', { method: 'DELETE' }),
};

export const OrderAPI = {
  create: (payload) => api('/api/users/orders', { method: 'POST', body: payload }),
  listMine: () => api('/api/users/orders'),
  sendConfirmation: (payload) => api('/api/users/order-confirmation', { method: 'POST', body: payload }),
};
