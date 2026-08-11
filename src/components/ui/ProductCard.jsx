import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Bolt } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckoutInterceptor } from '../../context/CheckoutInterceptorContext';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { intercept } = useCheckoutInterceptor();
  const navigate = useNavigate();
  const image = product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/400/400`;

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleBuyNow = async () => {
    try {
      await intercept('buy_now', { productId: product.id, quantity: 1 });
      addItem(product);
      navigate('/checkout');
    } catch (err) {
      if (err.message !== 'Authentication cancelled') {
        console.error('Buy now intercept failed:', err);
      }
    }
  };

  return (
    <div className="group card overflow-hidden animate-fade-in">
      <div className="relative aspect-square overflow-hidden bg-surface-100">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <button className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-surface-400 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 shadow-sm">
          <Heart className="h-4 w-4" />
        </button>
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
            {product.vendorName || 'NexusMart'}
          </p>
          <h3 className="text-sm font-semibold text-surface-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-surface-700">{product.rating?.toFixed(1) || '4.5'}</span>
          <span className="text-xs text-surface-400">({product.reviewCount || 0})</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-surface-900">₹{product.price?.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-surface-400 line-through">₹{product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBuyNow}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95"
              title="Buy Now"
            >
              <Bolt className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-all hover:bg-primary-600 hover:text-white hover:shadow-glow active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}