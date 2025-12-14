import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import all_product_data from '../Components/Assets/all_product';
import placeholderProduct from '../Components/Assets/placeholder_product.svg';
import { ProductsAPI, AddressAPI, CartAPI, WishlistAPI, loadToken } from '../api/client';
import { useToast } from '../Components/Toast/ToastProvider';

export const ShopContext = createContext(null);

const hasAuthToken = () => {
  const token = loadToken();
  return Boolean(token && token.trim());
};

const persistAddressLocal = (value) => {
  try {
    if (value) {
      localStorage.setItem('address', JSON.stringify(value));
    } else {
      localStorage.removeItem('address');
    }
  } catch { }
};

// resolve asset filenames (e.g. "product_1.png") to imported URLs from Assets
function importAll(r) {
  const images = {};
  r.keys().forEach((key) => { images[key] = r(key); });
  return images;
}

const ASSET_IMAGES = (() => {
  try {
    return importAll(require.context('../Components/Assets', false, /\.(png|jpe?g|svg)$/));
  } catch {
    return {};
  }
})();

const normalizeId = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  try {
    return value.toString();
  } catch {
    return fallback;
  }
};

const normalizeCategory = (value, fallback = 'general') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text.toLowerCase() : fallback;
};

const ShopContextProvider = ({ children }) => {
  const [all_product, setAllProduct] = useState([]);
  const [productError, setProductError] = useState(null);
  const [address, setAddress] = useState(() => {
    try {
      const raw = localStorage.getItem('address');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem('wishlist');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const toast = useToast();
  const lastProductToast = useRef(0);

  const persistCartLocal = useCallback((updater) => {
    setCart((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const persistWishlistLocal = useCallback((updater) => {
    setWishlist((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('wishlist', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const imageFrom = (name) => {
      if (!name || typeof name !== 'string') return null;
      // Handle uploaded files (server URLs)
      if (name.startsWith('/uploads/')) {
        const API_BASE = process.env.REACT_APP_API || 'http://localhost:5000';
        return `${API_BASE}${name}`;
      }
      // Handle external URLs
      if (/^https?:\/\//i.test(name)) return name;
      // Handle bundled assets
      const key = name.startsWith('./') ? name : `./${name}`;
      return ASSET_IMAGES[key] || null;
    };

    const fallbackList = Array.isArray(all_product_data) ? all_product_data : [];
    const normalizeEntry = (source, idx) => {
      const fallback = fallbackList[idx] || null;
      const pid = source && (source._id || source.id);
      const fallbackId = fallback && (fallback._id || fallback.id);
      const idCandidate = pid ?? fallbackId ?? (idx + 1);
      const idStr = normalizeId(idCandidate, String(idx + 1));
      const resolvedImage = imageFrom(source?.image)
        || imageFrom(fallback?.image)
        || fallback?.image
        || source?.image
        || placeholderProduct;

      return {
        id: idStr,
        _id: idStr,
        name: typeof source?.name === 'string' && source.name.trim() ? source.name : fallback?.name || `Product ${idx + 1}`,
        image: resolvedImage,
        new_price: source?.new_price ?? fallback?.new_price ?? 0,
        old_price: source?.old_price ?? fallback?.old_price ?? source?.new_price ?? fallback?.new_price ?? 0,
        category: normalizeCategory(source?.category ?? fallback?.category, fallback?.category ?? 'general'),
        sizes: Array.isArray(source?.sizes) && source.sizes.length ? source.sizes : fallback?.sizes || [],
        colors: Array.isArray(source?.colors) && source.colors.length ? source.colors : fallback?.colors || [],
        rating: typeof source?.rating === 'number' ? source.rating : fallback?.rating ?? 0,
        stock: typeof source?.stock === 'number' ? source.stock : fallback?.stock ?? 0,
        description: typeof source?.description === 'string' && source.description.trim() ? source.description : fallback?.description || '',
      };
    };

    const fallbackNormalized = fallbackList.map((item, idx) => normalizeEntry(item, idx));

    const fetchProducts = async ({ silent = false } = {}) => {
      try {
        const list = await ProductsAPI.list();
        if (!isMounted) return;

        if (Array.isArray(list) && list.length) {
          const normalized = list.map((p, idx) => normalizeEntry(p, idx));
          setAllProduct(normalized);
          setProductError(null);
        } else {
          setAllProduct(fallbackNormalized);
          setProductError('No products returned from server. Showing offline catalog.');
          if (!silent && toast && Date.now() - lastProductToast.current > 15000) {
            toast.warning('Products API returned no items. Showing offline catalog instead.');
            lastProductToast.current = Date.now();
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setAllProduct(fallbackNormalized);
        setProductError('Unable to load products from server. Showing offline catalog.');
        if (!silent && toast && Date.now() - lastProductToast.current > 15000) {
          const message = error?.message
            ? `Unable to reach products API (${error.message}). Showing offline catalog.`
            : 'Unable to reach products API. Showing offline catalog.';
          toast.error(message);
          lastProductToast.current = Date.now();
        }
      }
    };

    fetchProducts();

    const handleRefresh = () => fetchProducts({ silent: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('catalog:refresh', handleRefresh);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('catalog:refresh', handleRefresh);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const fetchAddress = useCallback(async () => {
    if (!hasAuthToken()) return;
    try {
      const resp = await AddressAPI.get();
      const nextAddress = resp && typeof resp === 'object' ? resp.address || null : null;
      setAddress(nextAddress);
      persistAddressLocal(nextAddress);
    } catch {
      // ignore and keep local copy
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!hasAuthToken()) return;
    try {
      const data = await CartAPI.get();
      const list = Array.isArray(data?.cart) ? data.cart : [];
      const normalized = list.map((entry) => ({
        productId: entry.product?._id || entry.product,
        size: entry.size || '',
        quantity: entry.quantity || 1,
        product: entry.product || null,
      }));
      persistCartLocal(normalized);
    } catch {
      // keep local cart
    }
  }, [persistCartLocal]);

  const fetchWishlist = useCallback(async () => {
    if (!hasAuthToken()) return;
    try {
      const data = await WishlistAPI.get();
      const list = Array.isArray(data?.wishlist) ? data.wishlist : [];
      const normalized = list.map((entry) => ({
        id: entry.product?._id || entry.product,
        size: entry.size || '',
        product: entry.product || null,
      })).filter((item) => item.id);
      persistWishlistLocal(normalized);
    } catch {
      // keep local wishlist
    }
  }, [persistWishlistLocal]);

  useEffect(() => {
    if (hasAuthToken()) {
      fetchAddress();
      fetchCart();
      fetchWishlist();
    }

    let off = () => {};
    try {
      if (typeof window !== 'undefined') {
        const handler = (event) => {
          const nextToken = event?.detail?.token;
          if (nextToken) {
            fetchAddress();
            fetchCart();
            fetchWishlist();
          } else {
            setAddress(null);
            persistAddressLocal(null);
            persistWishlistLocal([]);
            // keep local cart for guest flow
          }
        };
        window.addEventListener('auth_token_changed', handler);
        off = () => window.removeEventListener('auth_token_changed', handler);
      }
    } catch { }

    return () => {
      try { off(); } catch { }
    };
  }, [fetchAddress, fetchCart, fetchWishlist, persistWishlistLocal]);

  const updateAddress = async (next) => {
    if (!next) {
      setAddress(null);
      persistAddressLocal(null);
      if (hasAuthToken()) {
        try {
          await AddressAPI.save({
            fullName: '',
            phone: '',
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
          });
        } catch { }
      }
      return null;
    }

    const normalized = {
      fullName: next.fullName?.trim?.() || '',
      phone: next.phone?.trim?.() || '',
      line1: next.line1?.trim?.() || '',
      line2: next.line2?.trim?.() || '',
      city: next.city?.trim?.() || '',
      state: next.state?.trim?.() || '',
      postalCode: (next.postalCode ?? next.pincode ?? '').toString().trim(),
      country: next.country?.trim?.() || ''
    };

    if (hasAuthToken()) {
      try {
        const resp = await AddressAPI.save(normalized);
        const saved = resp && resp.address ? resp.address : normalized;
        setAddress(saved);
        persistAddressLocal(saved);
        return saved;
      } catch (error) {
        setAddress(normalized);
        persistAddressLocal(normalized);
        return normalized;
      }
    }

    setAddress(normalized);
    persistAddressLocal(normalized);
    return normalized;
  };

  const getCartItems = useCallback(() => {
    const byId = new Map(all_product.map((p) => [String(p._id || p.id), p]));
    return (Array.isArray(cart) ? cart : []).map((entry) => {
      const idStr = entry.productId != null ? String(entry.productId) : null;
      const product = idStr ? (byId.get(idStr) || entry.product || null) : entry.product || null;
      return {
        ...entry,
        product,
      };
    }).filter((item) => item.product);
  }, [all_product, cart]);

  const getCartCount = useCallback(() => (
    Array.isArray(cart)
      ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0
  ), [cart]);

  const getCartTotal = useCallback(() => (
    getCartItems().reduce((sum, item) => sum + (item.product?.new_price || 0) * (item.quantity || 0), 0)
  ), [getCartItems]);

  const getWishlistItems = useCallback(() => {
    const byId = new Map(all_product.map((p) => [String(p._id || p.id), p]));
    return (Array.isArray(wishlist) ? wishlist : []).map((entry) => {
      const idStr = entry.id != null ? String(entry.id) : null;
      const product = idStr ? (byId.get(idStr) || entry.product || null) : entry.product || null;
      return {
        ...entry,
        product,
      };
    }).filter((item) => item.product);
  }, [all_product, wishlist]);

  const isWishlisted = useCallback((rawProductId, size = '') => {
    const id = normalizeId(rawProductId, null);
    if (!id) return false;
    return (Array.isArray(wishlist) ? wishlist : []).some((entry) => String(entry.id) === String(id) && (size ? entry.size === size : true));
  }, [wishlist]);

  const addToCart = useCallback(async (rawProductId, size = '', quantity = 1) => {
    const productId = normalizeId(rawProductId, null);
    if (!productId) {
      if (toast) toast.error('Invalid product');
      return;
    }

    persistCartLocal((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const idx = list.findIndex((item) => String(item.productId) === String(productId) && (item.size || '') === (size || ''));
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          quantity: (list[idx].quantity || 0) + quantity,
        };
      } else {
        list.push({ productId, size, quantity });
      }
      return list;
    });

    if (toast) toast.success('Added to cart');

    if (hasAuthToken()) {
      try {
        await CartAPI.upsert({ productId, quantity, size });
        await fetchCart();
      } catch (error) {
        if (toast) toast.error(error?.message || 'Unable to sync cart');
      }
    }
  }, [fetchCart, persistCartLocal, toast]);

  const updateCartQuantity = useCallback(async (rawProductId, size = '', nextQty) => {
    const productId = normalizeId(rawProductId, null);
    const qty = Number(nextQty) || 0;
    if (!productId) return;

    persistCartLocal((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const idx = list.findIndex((item) => String(item.productId) === String(productId) && (item.size || '') === (size || ''));
      if (idx < 0) return list;
      if (qty <= 0) {
        list.splice(idx, 1);
      } else {
        list[idx] = { ...list[idx], quantity: qty };
      }
      return list;
    });

    if (hasAuthToken()) {
      try {
        if (qty <= 0) {
          await CartAPI.remove(productId, size);
        } else {
          await CartAPI.upsert({ productId, quantity: qty, size });
        }
        await fetchCart();
      } catch {}
    }
  }, [fetchCart, persistCartLocal]);

  const removeFromCart = useCallback(async (rawProductId, size = '') => {
    const productId = normalizeId(rawProductId, null);
    if (!productId) return;

    persistCartLocal((prev) => (
      Array.isArray(prev)
        ? prev.filter((item) => !(String(item.productId) === String(productId) && (item.size || '') === (size || '')))
        : []
    ));

    if (toast) toast.success('Item removed from cart');

    if (hasAuthToken()) {
      try {
        await CartAPI.remove(productId, size);
        await fetchCart();
      } catch {}
    }
  }, [fetchCart, persistCartLocal, toast]);

  const clearCart = useCallback(async () => {
    persistCartLocal([]);
    if (hasAuthToken()) {
      try {
        await CartAPI.clear();
        await fetchCart();
      } catch {}
    }
  }, [fetchCart, persistCartLocal]);

  const addToWishlist = useCallback(async (rawProductId, size = '') => {
    const id = normalizeId(rawProductId, null);
    if (!id) {
      if (toast) toast.error('Invalid product');
      return;
    }

    persistWishlistLocal((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const exists = list.some((entry) => String(entry.id) === String(id) && (entry.size || '') === (size || ''));
      if (!exists) list.push({ id, size });
      return list;
    });

    if (toast) toast.success('Added to wishlist');

    if (hasAuthToken()) {
      try {
        await WishlistAPI.add({ productId: id, size });
        await fetchWishlist();
      } catch (error) {
        if (toast) toast.error(error?.message || 'Unable to sync wishlist');
      }
    }
  }, [fetchWishlist, persistWishlistLocal, toast]);

  const removeFromWishlist = useCallback(async (rawProductId, size = '') => {
    const id = normalizeId(rawProductId, null);
    if (!id) return;

    persistWishlistLocal((prev) => (
      Array.isArray(prev)
        ? prev.filter((entry) => !(String(entry.id) === String(id) && (entry.size || '') === (size || '')))
        : []
    ));

    if (toast) toast.success('Removed from wishlist');

    if (hasAuthToken()) {
      try {
        await WishlistAPI.remove(id, size);
        await fetchWishlist();
      } catch {}
    }
  }, [fetchWishlist, persistWishlistLocal, toast]);

  const moveWishlistItemToCart = useCallback(async (rawProductId, size = '', quantity = 1) => {
    await addToCart(rawProductId, size, quantity);
    await removeFromWishlist(rawProductId, size);
  }, [addToCart, removeFromWishlist]);

  return (
    <ShopContext.Provider
      value={{
        all_product,
        productError,
        setAllProduct,
        address,
        setAddress: updateAddress,
        cart,
        getCartItems,
        getCartCount,
        getCartTotal,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlist,
        getWishlistItems,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        moveWishlistItemToCart,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
