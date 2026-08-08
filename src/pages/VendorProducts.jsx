import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProductsByVendor, createProduct, updateProduct, deleteProduct } from '../config/firestore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function VendorProducts() {
  const { user, isVendor, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'electronics',
    images: [''],
    stock: '',
    discount: 0,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getProductsByVendor(user.uid);
        setProducts(result);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProducts();
  }, [user]);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', originalPrice: '', category: 'electronics', images: [''], stock: '', discount: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category || 'electronics',
      images: product.images?.length > 0 ? product.images : [product.image || ''],
      stock: product.stock || '',
      discount: product.discount || 0,
    });
    setEditing(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      ...form,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      stock: parseInt(form.stock) || 0,
      discount: parseInt(form.discount) || 0,
      images: form.images.filter((img) => img.trim() !== ''),
      vendorId: user.uid,
      vendorName: user.displayName,
    };

    try {
      if (editing) {
        await updateProduct(editing, productData);
        setProducts(products.map((p) => (p.id === editing ? { ...p, ...productData } : p)));
      } else {
        const id = await createProduct(productData);
        setProducts([{ id, ...productData }, ...products]);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...form.images];
    newImages[index] = value;
    setForm({ ...form, images: newImages });
  };

  const addImageField = () => setForm({ ...form, images: [...form.images, ''] });

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isVendor) return <Navigate to="/" />;
  if (loading) return <LoadingSpinner size="lg" className="py-32" />;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">My Products</h1>
          <p className="mt-1 text-surface-500">{products.length} products listed</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-surface-900">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={resetForm} className="btn-ghost p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Product Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Premium Wireless Headphones"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Describe your product..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-field"
                    placeholder="99.99"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="input-field"
                    placeholder="129.99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home">Home & Living</option>
                    <option value="sports">Sports</option>
                    <option value="beauty">Beauty</option>
                    <option value="books">Books</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="input-field"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Image URLs</label>
                {form.images.map((img, i) => (
                  <input
                    key={i}
                    value={img}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    className="input-field mb-2"
                    placeholder="https://example.com/image.jpg"
                  />
                ))}
                <button type="button" onClick={addImageField} className="btn-ghost text-sm text-primary-600">
                  + Add another image
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="card p-4 flex items-center gap-4 animate-fade-in">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-100">
                <img
                  src={product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/64/64`}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 truncate">{product.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-primary-600">${product.price?.toFixed(2)}</span>
                  <span className="text-xs text-surface-400">{product.category}</span>
                  <span className={`badge ${product.active ? 'badge-success' : 'badge-warning'}`}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(product)} className="btn-ghost p-2">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(product.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start by adding your first product to the marketplace."
          action={() => setShowForm(true)}
          actionLabel="Add Product"
        />
      )}
    </div>
  );
}
