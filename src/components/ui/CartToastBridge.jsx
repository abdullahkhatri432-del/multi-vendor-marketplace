import { useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function CartToastBridge() {
  const { notifyItem } = useCart();
  const { addToast } = useToast();
  const prevItem = useRef(null);

  useEffect(() => {
    if (notifyItem && notifyItem !== prevItem.current) {
      addToast(`"${notifyItem}" added to cart`, 'success');
      prevItem.current = notifyItem;
    }
  }, [notifyItem, addToast]);

  return null;
}
