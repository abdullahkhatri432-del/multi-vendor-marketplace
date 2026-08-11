import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import LazyAuthModal from '../components/LazyAuthModal';
import { useAuth } from './AuthContext';

const CheckoutInterceptorContext = createContext(null);

export function CheckoutInterceptorProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [modalState, setModalState] = useState({
    isOpen: false,
    triggerAction: null,
    triggerParams: null,
  });

  const intercept = useCallback((action, params = {}) => {
    return new Promise((resolve, reject) => {
      if (isAuthenticated) {
        resolve();
        return;
      }
      setModalState({
        isOpen: true,
        triggerAction: action,
        triggerParams: { ...params, resolve, reject },
      });
    });
  }, [isAuthenticated]);

  const handleAuthSuccess = useCallback((user) => {
    if (modalState.triggerParams?.resolve) {
      modalState.triggerParams.resolve(user);
    }
    setModalState({ isOpen: false, triggerAction: null, triggerParams: null });
  }, [modalState.triggerParams]);

  const handleModalClose = useCallback(() => {
    if (modalState.triggerParams?.reject) {
      modalState.triggerParams.reject(new Error('Authentication cancelled'));
    }
    setModalState({ isOpen: false, triggerAction: null, triggerParams: null });
  }, [modalState.triggerParams]);

  const value = useMemo(() => ({
    intercept,
    modalState,
    handleAuthSuccess,
    handleModalClose,
  }), [intercept, modalState, handleAuthSuccess, handleModalClose]);

  return (
    <CheckoutInterceptorContext.Provider value={value}>
      {children}
      <LazyAuthModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onSuccess={handleAuthSuccess}
        triggerAction={modalState.triggerAction}
        triggerParams={modalState.triggerParams}
      />
    </CheckoutInterceptorContext.Provider>
  );
}

export const useCheckoutInterceptor = () => {
  const context = useContext(CheckoutInterceptorContext);
  if (!context) {
    throw new Error('useCheckoutInterceptor must be used within CheckoutInterceptorProvider');
  }
  return context;
};

// High-level action helpers
export const checkoutActions = {
  buyNow: 'buy_now',
  checkout: 'checkout',
  addToCart: 'add_to_cart',
  wishlist: 'wishlist',
};