import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const CART_KEY = 'speedersmania_cart';

// Cart quantities are clamped to the stock snapshot taken when the item was
// added. The server still revalidates stock at checkout — this only stops the
// UI from letting a customer order more than is available right now.
const toStock = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
};

const clampQuantity = (quantity, stock) => {
  const q = Math.max(1, Math.trunc(Number(quantity)) || 1);
  return stock === null ? q : Math.min(q, Math.max(1, stock));
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    case 'ADD_ITEM': {
      const incomingStock = toStock(action.payload.stock);
      if (incomingStock === 0) return state;

      const existing = state.find((item) => item.id === action.payload.id);
      if (existing) {
        return state.map((item) => {
          if (item.id !== action.payload.id) return item;
          const stock = toStock(item.stock) ?? incomingStock;
          const quantity = clampQuantity(item.quantity + (action.payload.quantity || 1), stock);
          const addonUnit = (item.addons || []).reduce((sum, addon) => sum + (addon.price || 0), 0);
          return { ...item, stock, quantity, addonTotal: addonUnit * quantity };
        });
      }
      const quantity = clampQuantity(action.payload.quantity || 1, incomingStock);
      return [...state, { ...action.payload, stock: incomingStock, quantity }];
    }
    case 'REMOVE_ITEM':
      return state.filter((item) => item.id !== action.payload);
    case 'UPDATE_QUANTITY':
      return state.map((item) => {
        if (item.id !== action.payload.id) return item;
        const quantity = clampQuantity(action.payload.quantity, toStock(item.stock));
        const addonUnit = (item.addons || []).reduce((sum, addon) => sum + (addon.price || 0), 0);
        return { ...item, quantity, addonTotal: addonUnit * quantity };
      });
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

// Read the persisted cart without ever throwing (corrupt/old data must not
// white-screen the app).
function loadInitialCart() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && Number.isFinite(Number(item.price)))
      .map((item) => {
        const stock = toStock(item.stock);
        return {
          ...item,
          stock,
          quantity: clampQuantity(Number(item.quantity) || 1, stock),
          addons: Array.isArray(item.addons) ? item.addons : [],
          addonTotal: Number(item.addonTotal) || 0,
        };
      });
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, dispatch] = useReducer(cartReducer, [], loadInitialCart);
  const [notifyItem, setNotifyItem] = useState(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (product, quantity = 1, selectedAddons = []) => {
    const stock = toStock(product.stock);
    if (stock === 0) {
      return { ok: false, reason: 'out-of-stock' };
    }

    const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || product.image,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        stock,
        quantity,
        addons: selectedAddons,
        addonTotal: addonTotal * quantity,
      },
    });
    setNotifyItem(product.name);
    return { ok: true };
  };

  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });

  const updateQuantity = (id, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity + (item.addonTotal || 0), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    notifyItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
