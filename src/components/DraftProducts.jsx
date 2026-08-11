import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Eye,
  Edit,
  Check,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Percent,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getPendingProducts,
  getPendingProduct,
  updatePendingProduct,
  publishPendingProduct,
  deletePendingProduct,
} from '../config/firestore';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

export default function DraftProducts() {
  const { user, isVendor, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    if (user) {
      loadDrafts();
    }
  }, [user]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const products = await getPendingProducts(user.uid);
      setDrafts(products);
    } catch (err) {
      console.error('Failed to load drafts:', err);
      addToast('Failed to load draft products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      scrapedPrice: product.scrapedPrice,
      markupPercentage: product.markupPercentage || 20,
      category: product.category,
      images: product.images || [],
      stock: product.stock || 0,
      discount: product.discount || 0,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type } = e.target;
    if (name === 'images') return;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const currentImages = editForm.images || [];
    const newImages = files.map(file => URL.createObjectURL(file));
    setEditForm(prev => ({
      ...prev,
      images: [...currentImages, ...newImages]
    }));
  };

  const removeImage = (index) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      const updateData = {
        ...editForm,
        updatedAt: new Date().toISOString(),
      };
      await updatePendingProduct(editingId, updateData);
      setDrafts(drafts.map(d => d.id === editingId ? { ...d, ...updateData } : d));
      setEditingId(null);
      addToast('Draft updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update draft:', err);
      addToast('Failed to update draft', 'error');
    }
  };

  const handlePublish = async (productId) => {
    try {
      setPublishingId(productId);
      const newProductId = await publishPendingProduct(productId);
      setDrafts(drafts.filter(d => d.id !== productId));
      addToast('Product published successfully!', 'success');
    } catch (err) {
      console.error('Failed to publish:', err);
      addToast(err.message || 'Failed to publish product', 'error');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    try {
      setDeletingId(productId);
      await deletePendingProduct(productId);
      setDrafts(drafts.filter(d => d.id !== productId));
      addToast('Draft deleted', 'success');
    } catch (err) {
      console.error('Failed to delete:', err);
      addToast('Failed to delete draft', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (productId) => {
    setViewingId(viewingId === productId ? null : productId);
  };

  const calculateProfit = (product) => {
    const scraped = product.scrapedPrice || product.price;
    const final = product.price;
    const profit = final - scraped;
    const margin = scraped > 0 ? ((profit / scraped) * 100).toFixed(1) : 0;
    return { profit: profit.toFixed(2), margin };
  };

  if (!isAuthenticated) return null;
  if (!isVendor) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900">Draft Products</h2>
          <p className="text-sm text-surface-500 mt-1">
            Review and publish products imported via bulk import
          </p>
        </div>
        <Link
          to="/vendor/products?tab=import"
          className="btn-secondary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Bulk Import More
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : drafts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No draft products"
          description="Import products in bulk to see them here for review before publishing."
          action={() => navigate('/vendor/products?tab=import')}
          actionLabel="Bulk Import Products"
        />
      ) : (
        <>
          <div className="mb-4 rounded-xl bg-primary-50 border border-primary-100 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700">{drafts.length}</p>
                <p className="text-primary-600">Total Drafts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {drafts.filter(d => d.status === 'draft').length}
                </p>
                <p className="text-emerald-600">Ready to Publish</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {drafts.reduce((sum, d) => sum + (d.price || 0), 0).toFixed(2)}
                </p>
                <p className="text-amber-600">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700">
                  {drafts.reduce((sum, d) => sum + (calculateProfit(d).profit * 1), 0).toFixed(2)}
                </p>
                <p className="text-primary-600">Est. Profit</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="pb-3 text-left font-medium text-surface-500">Product</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Category</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Scraped Price</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Markup %</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Final Price</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Profit</th>
                  <th className="pb-3 text-left font-medium text-surface-500">Status</th>
                  <th className="pb-3 text-right font-medium text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {drafts.map((product) => {
                  const profit = calculateProfit(product);
                  const isEditing = editingId === product.id;
                  const isPublishing = publishingId === product.id;
                  const isDeleting = deletingId === product.id;

                  return (
                    <tr key={product.id} className={`hover:bg-surface-50 ${isEditing ? 'bg-primary-50' : ''}`}>
                      <td className="py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            className="input-field w-full max-w-xs"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-surface-900 line-clamp-1">
                                {product.name}
                              </p>
                              <p className="text-xs text-surface-500">
                                ID: {product.id?.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            name="category"
                            value={editForm.category}
                            onChange={handleEditChange}
                            className="input-field w-full max-w-xs"
                          />
                        ) : (
                          <span className="capitalize text-surface-700">
                            {product.category || 'general'}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            name="scrapedPrice"
                            value={editForm.scrapedPrice}
                            onChange={handleEditChange}
                            className="input-field w-24"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-surface-600 font-mono">
                            ₹{(product.scrapedPrice || product.price || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            name="markupPercentage"
                            value={editForm.markupPercentage}
                            onChange={handleEditChange}
                            className="input-field w-20"
                            min={0}
                            max={100}
                          />
                        ) : (
                          <span className="text-surface-700 font-medium">
                            {product.markupPercentage || 20}%
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            name="price"
                            value={editForm.price}
                            onChange={handleEditChange}
                            className="input-field w-24"
                            step="0.01"
                          />
                        ) : (
                          <span className="font-bold text-surface-900 font-mono">
                            ₹{(product.price || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`font-semibold font-mono ${
                          profit.profit > 0 ? 'text-emerald-600' : profit.profit < 0 ? 'text-red-600' : 'text-surface-600'
                        }`}>
                          ₹{profit.profit} ({profit.margin}%)
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">
                          Draft
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="btn-primary text-xs py-1.5 px-3"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                Cancel
                              </button>
                            </>
                          ) : viewingId === product.id ? (
                            <button
                              onClick={() => setViewingId(null)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Close
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleView(product.id)}
                                className="btn-ghost text-xs py-1.5 px-3"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditClick(product)}
                                className="btn-secondary text-xs py-1.5 px-3"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handlePublish(product.id)}
                                disabled={isPublishing}
                                className="btn-primary text-xs py-1.5 px-3"
                                title="Publish"
                              >
                                {isPublishing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ArrowUp className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                disabled={isDeleting}
                                className="btn-ghost text-xs py-1.5 px-3 text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {drafts.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-sm text-surface-600">
                <strong>Tip:</strong> Review each product's scraped price and markup percentage before publishing.
                The final price includes the auto-applied markup. You can adjust prices individually by clicking Edit.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function calculateProfit(product) {
  const scraped = product.scrapedPrice || product.price;
  const final = product.price;
  const profit = final - scraped;
  const margin = scraped > 0 ? ((profit / scraped) * 100).toFixed(1) : 0;
  return { profit: profit.toFixed(2), margin };
}