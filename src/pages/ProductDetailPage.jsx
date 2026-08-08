import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Truck, Shield, RotateCcw, Heart, ArrowLeft, Minus, Plus, Store } from 'lucide-react';
import { getProduct, getVendor } from '../config/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const prod = await getProduct(id);
        if (prod) {
          setProduct(prod);
          if (prod.vendorId) {
            const vend = await getVendor(prod.vendorId);
            setVendor(vend);
          }
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addItem(product, quantity);
  };

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-surface-900">Product Not Found</h2>
        <Link to="/products" className="btn-primary mt-6">Browse Products</Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image || `https://picsum.photos/seed/${product.id}/600/600`];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-surface-100">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${
                    i === selectedImage ? 'border-primary-500 shadow-glow' : 'border-surface-200'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-primary">{product.category || 'General'}</span>
            {product.discount > 0 && (
              <span className="badge-danger">-{product.discount}% OFF</span>
            )}
          </div>

          <h1 className="text-3xl font-display font-bold text-surface-900 leading-tight">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(product.rating || 4) ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}`}
                />
              ))}
            </div>
            <span className="text-sm text-surface-500">
              {product.rating?.toFixed(1) || '4.5'} ({product.reviewCount || 0} reviews)
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-surface-900">${product.price?.toFixed(2)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-surface-400 line-through">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>

          <p className="mt-6 text-surface-600 leading-relaxed">{product.description}</p>

          {/* Vendor Info */}
          {vendor && (
            <Link
              to={`/products?vendor=${product.vendorId}`}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-surface-100 p-4 hover:border-primary-200 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <Store className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">{vendor.storeName}</p>
                <p className="text-xs text-surface-500">{vendor.totalSales || 0} sales</p>
              </div>
            </Link>
          )}

          {/* Quantity & Add to Cart */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-surface-200 bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAddToCart} className="btn-primary flex-1">
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-200 text-surface-400 hover:text-red-500 hover:border-red-200 transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Truck, label: 'Free Shipping' },
              { icon: Shield, label: 'Secure Payment' },
              { icon: RotateCcw, label: 'Easy Returns' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-surface-50 p-4 text-center">
                <Icon className="h-5 w-5 text-primary-600" />
                <span className="text-xs font-medium text-surface-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
