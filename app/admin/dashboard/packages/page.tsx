'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Edit,
  Save,
  X,
  Package,
  Clock,
  Zap,
  CheckCircle,
  TrendingUp,
  Users,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Image,
  Upload,
  Copy
} from 'lucide-react';

interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  long_description: string;
  features: string[];
  specifications: Array<{ spec_key: string; spec_value: string }>;
  trust_indicators?: Array<{ label: string; icon: string }>;
  processing_time: string;
  min_cards?: number;
  max_cards?: number;
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
  icon_name?: string;
  icon_url?: string;
  image_url?: string;
}

export default function PackageManagement() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ServicePackage>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg.id);
    setEditForm({ ...pkg });
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditForm({
      id: '',
      name: '',
      slug: '',
      price: 0,
      description: '',
      long_description: '',
      features: [''],
      specifications: [{ spec_key: '', spec_value: '' }],
      trust_indicators: [
        { label: 'Secure Processing', icon: 'shield' },
        { label: 'Free Shipping', icon: 'package' },
        { label: 'Guaranteed Quality', icon: 'check' }
      ],
      processing_time: '',
      min_cards: 1,
      is_active: true,
      is_popular: false,
      display_order: packages.length
    });
  };

  const handleDuplicatePackage = (pkg: ServicePackage) => {
    setIsCreating(true);
    setEditForm({
      ...pkg,
      id: '',
      name: `${pkg.name} (Copy)`,
      slug: `${pkg.slug}-copy-${Date.now()}`,
      display_order: packages.length
    });
  };

  const handleSavePackage = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const method = isCreating ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/packages', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.success) {
        alert(`Package ${isCreating ? 'created' : 'updated'} successfully!`);
        setEditingPackage(null);
        setIsCreating(false);
        setEditForm({});
        fetchPackages();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/packages?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Package deleted successfully!');
        fetchPackages();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/packages', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      if (data.success) {
        fetchPackages();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleImageUpload = async (file: File, type: 'icon' | 'image') => {
    try {
      const isIcon = type === 'icon';
      if (isIcon) {
        setUploadingIcon(true);
      } else {
        setUploadingImage(true);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/packages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        if (isIcon) {
          setEditForm({ ...editForm, icon_url: data.url });
        } else {
          setEditForm({ ...editForm, image_url: data.url });
        }
        alert('Image uploaded successfully!');
      } else {
        alert(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      if (type === 'icon') {
        setUploadingIcon(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const addFeature = () => {
    setEditForm({
      ...editForm,
      features: [...(editForm.features || []), '']
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures.splice(index, 1);
    setEditForm({ ...editForm, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures[index] = value;
    setEditForm({ ...editForm, features: newFeatures });
  };

  const addSpecification = () => {
    setEditForm({
      ...editForm,
      specifications: [...(editForm.specifications || []), { spec_key: '', spec_value: '' }]
    });
  };

  const removeSpecification = (index: number) => {
    const newSpecs = [...(editForm.specifications || [])];
    newSpecs.splice(index, 1);
    setEditForm({ ...editForm, specifications: newSpecs });
  };

  const updateSpecification = (index: number, field: 'spec_key' | 'spec_value', value: string) => {
    const newSpecs = [...(editForm.specifications || [])];
    newSpecs[index][field] = value;
    setEditForm({ ...editForm, specifications: newSpecs });
  };

  const addTrustIndicator = () => {
    setEditForm({
      ...editForm,
      trust_indicators: [...(editForm.trust_indicators || []), { label: '', icon: 'check' }]
    });
  };

  const removeTrustIndicator = (index: number) => {
    const newIndicators = [...(editForm.trust_indicators || [])];
    newIndicators.splice(index, 1);
    setEditForm({ ...editForm, trust_indicators: newIndicators });
  };

  const updateTrustIndicator = (index: number, field: 'label' | 'icon', value: string) => {
    const newIndicators = [...(editForm.trust_indicators || [])];
    newIndicators[index][field] = value;
    setEditForm({ ...editForm, trust_indicators: newIndicators });
  };

  const handleCancelEdit = () => {
    setEditingPackage(null);
    setIsCreating(false);
    setEditForm({});
  };

  if (loading) {
    return (
      <div id="packages-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a]"></div>
      </div>
    );
  }

  return (
    <div id="package-management-container" className="space-y-6">
      {/* Header */}
      <div id="packages-header" className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Package Management</h2>
          <p className="text-gray-400">Manage your service packages, pricing, and features</p>
        </div>
        <button
          id="create-package-btn"
          onClick={handleStartCreate}
          className="bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Package</span>
        </button>
      </div>

      {/* Create/Edit Modal */}
      {(editingPackage || isCreating) && (
        <div id="package-modal-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div id="package-modal-container" className="bg-[#171717] border border-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {isCreating ? 'Create New Package' : 'Edit Package'}
              </h3>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div id="basic-info-section" className="space-y-4">
                <h4 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Basic Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Package ID *</label>
                    <input
                      id="package-id-input"
                      type="text"
                      value={editForm.id || ''}
                      onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                      disabled={!isCreating}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white disabled:opacity-50"
                      placeholder="e.g., premium-grading"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Package Name *</label>
                    <input
                      id="package-name-input"
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="e.g., Premium Grading"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                    <input
                      id="package-slug-input"
                      type="text"
                      value={editForm.slug || ''}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="premium-grading"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Price per Card *</label>
                    <input
                      id="package-price-input"
                      type="number"
                      step="0.01"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Processing Time</label>
                    <input
                      id="package-processing-time-input"
                      type="text"
                      value={editForm.processing_time || ''}
                      onChange={(e) => setEditForm({ ...editForm, processing_time: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="e.g., 3-5 business days"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Icon Name</label>
                    <input
                      id="package-icon-input"
                      type="text"
                      value={editForm.icon_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, icon_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="e.g., star, zap, shield"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                  <div id="icon-upload-section">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon Upload</label>
                    <div className="space-y-2">
                      <input
                        id="icon-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'icon');
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('icon-upload-input')?.click()}
                        disabled={uploadingIcon}
                        className="w-full px-4 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white hover:bg-gray-800 flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {uploadingIcon ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#d83f0a]"></div>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            <span>Upload Icon</span>
                          </>
                        )}
                      </button>
                      {editForm.icon_url && (
                        <div className="p-3 bg-[#0b0b0b] border border-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Current Icon:</span>
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, icon_url: '' })}
                              className="text-red-500 hover:text-red-400 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <img
                            src={editForm.icon_url}
                            alt="Icon preview"
                            className="w-16 h-16 object-contain bg-white rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div id="image-upload-section">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Package Image</label>
                    <div className="space-y-2">
                      <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'image');
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('image-upload-input')?.click()}
                        disabled={uploadingImage}
                        className="w-full px-4 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white hover:bg-gray-800 flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#d83f0a]"></div>
                        ) : (
                          <>
                            <Image className="h-5 w-5" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </button>
                      {editForm.image_url && (
                        <div className="p-3 bg-[#0b0b0b] border border-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Current Image:</span>
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, image_url: '' })}
                              className="text-red-500 hover:text-red-400 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <img
                            src={editForm.image_url}
                            alt="Package preview"
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Min Cards</label>
                    <input
                      id="package-min-cards-input"
                      type="number"
                      value={editForm.min_cards || 1}
                      onChange={(e) => setEditForm({ ...editForm, min_cards: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                    <input
                      id="package-display-order-input"
                      type="number"
                      value={editForm.display_order || 0}
                      onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Short Description</label>
                  <input
                    id="package-description-input"
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                    placeholder="Brief description for card display"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Long Description</label>
                  <textarea
                    id="package-long-description-input"
                    value={editForm.long_description || ''}
                    onChange={(e) => setEditForm({ ...editForm, long_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                    placeholder="Detailed description for package detail page"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      id="package-active-checkbox"
                      type="checkbox"
                      checked={editForm.is_active || false}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      id="package-popular-checkbox"
                      type="checkbox"
                      checked={editForm.is_popular || false}
                      onChange={(e) => setEditForm({ ...editForm, is_popular: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Mark as Popular</span>
                  </label>
                </div>
              </div>

              {/* Features Section */}
              <div id="features-section" className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <h4 className="text-lg font-semibold text-white">Features</h4>
                  <button
                    onClick={addFeature}
                    className="text-[#d83f0a] hover:text-[#d66a0a] text-sm flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Feature</span>
                  </button>
                </div>

                {editForm.features?.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="Feature description"
                    />
                    <button
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Specifications Section */}
              <div id="specifications-section" className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <h4 className="text-lg font-semibold text-white">Specifications</h4>
                  <button
                    onClick={addSpecification}
                    className="text-[#d83f0a] hover:text-[#d66a0a] text-sm flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Specification</span>
                  </button>
                </div>

                {editForm.specifications?.map((spec, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={spec.spec_key}
                      onChange={(e) => updateSpecification(index, 'spec_key', e.target.value)}
                      className="w-1/3 px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={spec.spec_value}
                      onChange={(e) => updateSpecification(index, 'spec_value', e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => removeSpecification(index)}
                      className="p-2 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Trust Indicators Section */}
              <div id="trust-indicators-section" className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <h4 className="text-lg font-semibold text-white">Trust Indicators</h4>
                  <button
                    onClick={addTrustIndicator}
                    className="text-[#d83f0a] hover:text-[#d66a0a] text-sm flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Indicator</span>
                  </button>
                </div>

                {editForm.trust_indicators?.map((indicator, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={indicator.label}
                      onChange={(e) => updateTrustIndicator(index, 'label', e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                      placeholder="e.g., Secure Processing"
                    />
                    <select
                      value={indicator.icon}
                      onChange={(e) => updateTrustIndicator(index, 'icon', e.target.value)}
                      className="w-32 px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white"
                    >
                      <option value="shield">Shield</option>
                      <option value="package">Package</option>
                      <option value="check">Check</option>
                      <option value="star">Star</option>
                      <option value="clock">Clock</option>
                      <option value="zap">Zap</option>
                    </select>
                    <button
                      onClick={() => removeTrustIndicator(index)}
                      className="p-2 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-[#0b0b0b]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePackage}
                  className="px-4 py-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isCreating ? 'Create' : 'Save'} Package</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div id="packages-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} id={`package-card-${pkg.id}`} className="bg-[#171717] border border-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${pkg.is_popular ? 'bg-[#d83f0a]/20' : 'bg-gray-800'}`}>
                  <Package className={`h-6 w-6 ${pkg.is_popular ? 'text-[#d83f0a]' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                  <p className="text-sm text-gray-400">{pkg.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleStatus(pkg.id)}
                  className={`p-2 rounded ${pkg.is_active ? 'text-green-500' : 'text-gray-500'}`}
                  title={pkg.is_active ? 'Active' : 'Inactive'}
                >
                  {pkg.is_active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => handleStartEdit(pkg)}
                  className="p-2 text-[#d83f0a] hover:text-[#d66a0a]"
                  title="Edit Package"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  id={`duplicate-pkg-btn-${pkg.id}`}
                  onClick={() => handleDuplicatePackage(pkg)}
                  className="p-2 text-blue-500 hover:text-blue-400"
                  title="Duplicate Package"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="p-2 text-red-500 hover:text-red-400"
                  title="Delete Package"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-[#d83f0a]">${pkg.price.toFixed(2)}</div>
              <div className="text-sm text-gray-400">per card</div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                {pkg.processing_time}
              </div>
              {pkg.min_cards && pkg.min_cards > 1 && (
                <div className="flex items-center text-sm text-gray-400">
                  <Package className="h-4 w-4 mr-2" />
                  Minimum {pkg.min_cards} cards
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Features:</h4>
              <ul className="space-y-1">
                {pkg.features?.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-400">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
                {pkg.features && pkg.features.length > 3 && (
                  <li className="text-sm text-gray-500">+{pkg.features.length - 3} more</li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              {pkg.is_popular && (
                <span className="px-2 py-1 bg-[#d83f0a]/20 text-[#d83f0a] text-xs font-semibold rounded">
                  POPULAR
                </span>
              )}
              {!pkg.is_popular && <div></div>}
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && !loading && (
        <div id="no-packages-message" className="text-center py-12 bg-[#171717] border border-gray-800 rounded-lg">
          <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Packages Yet</h3>
          <p className="text-gray-400 mb-4">Create your first pricing package to get started</p>
          <button
            onClick={handleStartCreate}
            className="px-4 py-2 bg-gradient-to-r from-[#d83f0a] to-[#d66a0a] text-white rounded-lg hover:opacity-90"
          >
            Create Package
          </button>
        </div>
      )}
    </div>
  );
}
