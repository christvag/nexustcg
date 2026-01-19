'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  ChevronDown,
  Type,
  ToggleLeft,
  GripVertical,
  Settings,
  Eye,
  Image,
  Upload,
  Loader2
} from 'lucide-react'

// id: admin-packages-v2-page-001

interface Package {
  id: number
  name: string
  slug: string
  price: number
  price_suffix: string
  cta_text: string
  cta_url: string | null
  description: string | null
  long_description: string | null
  icon_url: string | null
  image_url: string | null
  highlight_color: string
  is_featured: number
  is_active: number
  display_order: number
}

interface Feature {
  id: number
  name: string
  description: string | null
  category: string
  display_order: number
  is_active: number
}

interface FeatureValue {
  id: number
  package_id: number
  feature_id: number
  value_type: 'check' | 'dropdown' | 'text'
  is_checked: number
  text_value: string | null
  dropdown_options: string | null
  dropdown_selected: string | null
}

export default function PackagesV2Page() {
  const [packages, setPackages] = useState<Package[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [featureValues, setFeatureValues] = useState<FeatureValue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'table' | 'packages' | 'features'>('table')

  // Modal states
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)

  // Form states
  const [packageForm, setPackageForm] = useState({
    name: '',
    slug: '',
    price: 0,
    price_suffix: '/card',
    cta_text: 'Get Started',
    cta_url: '',
    description: '',
    long_description: '',
    icon_url: '',
    image_url: '',
    highlight_color: '#d83f0a',
    is_featured: false,
    is_active: true,
    display_order: 0
  })

  const [featureForm, setFeatureForm] = useState({
    name: '',
    description: '',
    category: 'general',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/packages-v2', {
        headers: getAuthHeaders()
      })
      const data = await response.json()

      if (data.success) {
        setPackages(data.packages || [])
        setFeatures(data.features || [])
        setFeatureValues(data.featureValues || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFeatureValue = (packageId: number, featureId: number): FeatureValue | undefined => {
    return featureValues.find(fv => fv.package_id === packageId && fv.feature_id === featureId)
  }

  const updateFeatureValue = async (
    packageId: number,
    featureId: number,
    updates: Partial<FeatureValue>
  ) => {
    try {
      const response = await fetch('/api/admin/packages-v2/values', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          package_id: packageId,
          feature_id: featureId,
          ...updates
        })
      })

      if (response.ok) {
        // Update local state
        setFeatureValues(prev => {
          const existing = prev.find(fv => fv.package_id === packageId && fv.feature_id === featureId)
          if (existing) {
            return prev.map(fv =>
              fv.package_id === packageId && fv.feature_id === featureId
                ? { ...fv, ...updates }
                : fv
            )
          } else {
            return [...prev, {
              id: Date.now(),
              package_id: packageId,
              feature_id: featureId,
              value_type: 'check',
              is_checked: 0,
              text_value: null,
              dropdown_options: null,
              dropdown_selected: null,
              ...updates
            } as FeatureValue]
          }
        })
      }
    } catch (error) {
      console.error('Error updating feature value:', error)
    }
  }

  // Package CRUD
  const savePackage = async () => {
    try {
      const method = editingPackage ? 'PUT' : 'POST'
      const body = editingPackage
        ? { id: editingPackage.id, ...packageForm }
        : packageForm

      const response = await fetch('/api/admin/packages-v2', {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setShowPackageModal(false)
        setEditingPackage(null)
        resetPackageForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error saving package:', error)
    }
  }

  const deletePackage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const response = await fetch(`/api/admin/packages-v2?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting package:', error)
    }
  }

  // Feature CRUD
  const saveFeature = async () => {
    try {
      const method = editingFeature ? 'PUT' : 'POST'
      const body = editingFeature
        ? { id: editingFeature.id, ...featureForm }
        : featureForm

      const response = await fetch('/api/admin/packages-v2/features', {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setShowFeatureModal(false)
        setEditingFeature(null)
        resetFeatureForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error saving feature:', error)
    }
  }

  const deleteFeature = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feature?')) return

    try {
      const response = await fetch(`/api/admin/packages-v2/features?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting feature:', error)
    }
  }

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      slug: '',
      price: 0,
      price_suffix: '/card',
      cta_text: 'Get Started',
      cta_url: '',
      description: '',
      long_description: '',
      icon_url: '',
      image_url: '',
      highlight_color: '#d83f0a',
      is_featured: false,
      is_active: true,
      display_order: packages.length
    })
  }

  const resetFeatureForm = () => {
    setFeatureForm({
      name: '',
      description: '',
      category: 'general',
      display_order: features.length,
      is_active: true
    })
  }

  const openEditPackage = (pkg: Package) => {
    setEditingPackage(pkg)
    setPackageForm({
      name: pkg.name,
      slug: pkg.slug,
      price: pkg.price,
      price_suffix: pkg.price_suffix || '/card',
      cta_text: pkg.cta_text || 'Get Started',
      cta_url: pkg.cta_url || '',
      description: pkg.description || '',
      long_description: pkg.long_description || '',
      icon_url: pkg.icon_url || '',
      image_url: pkg.image_url || '',
      highlight_color: pkg.highlight_color || '#d83f0a',
      is_featured: pkg.is_featured === 1,
      is_active: pkg.is_active === 1,
      display_order: pkg.display_order
    })
    setShowPackageModal(true)
  }

  const openEditFeature = (feat: Feature) => {
    setEditingFeature(feat)
    setFeatureForm({
      name: feat.name,
      description: feat.description || '',
      category: feat.category || 'general',
      display_order: feat.display_order,
      is_active: feat.is_active === 1
    })
    setShowFeatureModal(true)
  }

  if (isLoading) {
    return (
      <div id="packages-v2-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d83f0a]"></div>
      </div>
    )
  }

  return (
    <div id="packages-v2-page" className="space-y-6">
      {/* Header */}
      <div id="packages-v2-header" className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Packages V2</h1>
          <p className="text-gray-400 mt-1">Configure table-style pricing page</p>
        </div>
        <a
          href="/packages-v2"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-[#171717] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <Eye className="h-4 w-4" />
          Preview
        </a>
      </div>

      {/* Tabs */}
      <div id="packages-v2-tabs" className="flex gap-2 border-b border-gray-800">
        {[
          { key: 'table', label: 'Pricing Table' },
          { key: 'packages', label: 'Packages (Columns)' },
          { key: 'features', label: 'Features (Rows)' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[#d83f0a] border-b-2 border-[#d83f0a]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pricing Table Tab */}
      {activeTab === 'table' && (
        <div id="pricing-table-section" className="bg-[#171717] border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0b0b0b]">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 w-48">
                    Features
                  </th>
                  {packages.filter(p => p.is_active).map(pkg => (
                    <th
                      key={pkg.id}
                      className="px-4 py-3 text-center text-sm font-medium min-w-[150px]"
                      style={{ color: pkg.highlight_color }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-white">{pkg.name}</span>
                        <span className="text-2xl font-bold" style={{ color: pkg.highlight_color }}>
                          ${pkg.price}
                          <span className="text-sm text-gray-400">{pkg.price_suffix}</span>
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {features.filter(f => f.is_active).map(feature => (
                  <tr key={feature.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {feature.name}
                    </td>
                    {packages.filter(p => p.is_active).map(pkg => {
                      const value = getFeatureValue(pkg.id, feature.id)
                      return (
                        <td key={`${pkg.id}-${feature.id}`} className="px-4 py-3 text-center">
                          <FeatureValueCell
                            value={value}
                            packageId={pkg.id}
                            featureId={feature.id}
                            onUpdate={updateFeatureValue}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {features.filter(f => f.is_active).length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No features added yet. Go to "Features (Rows)" tab to add features.
            </div>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div id="packages-management-section" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Manage Packages</h2>
            <button
              onClick={() => {
                resetPackageForm()
                setEditingPackage(null)
                setShowPackageModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b83509] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Package
            </button>
          </div>

          <div className="grid gap-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                id={`package-card-${pkg.id}`}
                className={`bg-[#171717] border rounded-lg p-4 flex justify-between items-center ${
                  pkg.is_active ? 'border-gray-800' : 'border-gray-800 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-gray-600 cursor-move" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{pkg.name}</span>
                      {pkg.is_featured === 1 && (
                        <span className="px-2 py-0.5 bg-[#d83f0a]/20 text-[#d83f0a] text-xs rounded">
                          Featured
                        </span>
                      )}
                      {pkg.is_active === 0 && (
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      ${pkg.price}{pkg.price_suffix} • {pkg.slug}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditPackage(pkg)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePackage(pkg.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div id="features-management-section" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Manage Features</h2>
            <button
              onClick={() => {
                resetFeatureForm()
                setEditingFeature(null)
                setShowFeatureModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b83509] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Feature
            </button>
          </div>

          <div className="grid gap-4">
            {features.map(feat => (
              <div
                key={feat.id}
                id={`feature-card-${feat.id}`}
                className={`bg-[#171717] border rounded-lg p-4 flex justify-between items-center ${
                  feat.is_active ? 'border-gray-800' : 'border-gray-800 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-gray-600 cursor-move" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{feat.name}</span>
                      {feat.is_active === 0 && (
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {feat.description && (
                      <div className="text-sm text-gray-400">{feat.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditFeature(feat)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteFeature(feat.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div id="package-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={e => setPackageForm(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: prev.slug || e.target.value.toLowerCase().replace(/\s+/g, '-')
                  }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                  placeholder="e.g., Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                <input
                  type="text"
                  value={packageForm.slug}
                  onChange={e => setPackageForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                  placeholder="e.g., premium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
                  <input
                    type="number"
                    value={packageForm.price}
                    onChange={e => setPackageForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price Suffix</label>
                  <input
                    type="text"
                    value={packageForm.price_suffix}
                    onChange={e => setPackageForm(prev => ({ ...prev, price_suffix: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                    placeholder="/card"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">CTA Text</label>
                <input
                  type="text"
                  value={packageForm.cta_text}
                  onChange={e => setPackageForm(prev => ({ ...prev, cta_text: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                  placeholder="Get Started"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Short Description</label>
                <textarea
                  value={packageForm.description}
                  onChange={e => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none resize-none"
                  rows={2}
                  placeholder="Brief description for the pricing table"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Long Description</label>
                <textarea
                  value={packageForm.long_description}
                  onChange={e => setPackageForm(prev => ({ ...prev, long_description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none resize-none"
                  rows={4}
                  placeholder="Detailed description for the package detail page"
                />
              </div>

              {/* Icon and Image Uploads */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Media
                </h4>

                <div className="space-y-4">
                  {/* Icon Upload */}
                  <FileUploadField
                    label="Package Icon (for pricing table)"
                    value={packageForm.icon_url}
                    onChange={(url) => setPackageForm(prev => ({ ...prev, icon_url: url }))}
                    uploadType="icons"
                    instructions="Recommended: 64x64px or 128x128px, PNG or SVG format"
                    previewSize="small"
                  />

                  {/* Image Upload */}
                  <FileUploadField
                    label="Package Thumbnail (for detail page)"
                    value={packageForm.image_url}
                    onChange={(url) => setPackageForm(prev => ({ ...prev, image_url: url }))}
                    uploadType="packages"
                    instructions="Recommended: 400x300px or larger, PNG/JPG/WebP format, max 5MB"
                    previewSize="large"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Highlight Color</label>
                <input
                  type="color"
                  value={packageForm.highlight_color}
                  onChange={e => setPackageForm(prev => ({ ...prev, highlight_color: e.target.value }))}
                  className="w-full h-10 bg-[#0b0b0b] border border-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.is_featured}
                    onChange={e => setPackageForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0b0b0b] text-[#d83f0a] focus:ring-[#d83f0a]"
                  />
                  <span className="text-sm text-gray-300">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.is_active}
                    onChange={e => setPackageForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0b0b0b] text-[#d83f0a] focus:ring-[#d83f0a]"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePackage}
                  className="flex-1 px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b83509] transition-colors"
                >
                  {editingPackage ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <div id="feature-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingFeature ? 'Edit Feature' : 'Add Feature'}
              </h3>
              <button
                onClick={() => setShowFeatureModal(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={featureForm.name}
                  onChange={e => setFeatureForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                  placeholder="e.g., Real-Time Tracking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  value={featureForm.description}
                  onChange={e => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={featureForm.category}
                  onChange={e => setFeatureForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0b0b0b] border border-gray-700 rounded-lg text-white focus:border-[#d83f0a] focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="features">Features</option>
                  <option value="support">Support</option>
                  <option value="extras">Extras</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featureForm.is_active}
                  onChange={e => setFeatureForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-700 bg-[#0b0b0b] text-[#d83f0a] focus:ring-[#d83f0a]"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowFeatureModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFeature}
                  className="flex-1 px-4 py-2 bg-[#d83f0a] text-white rounded-lg hover:bg-[#b83509] transition-colors"
                >
                  {editingFeature ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// File Upload Field Component
// id: file-upload-field-001
function FileUploadField({
  label,
  value,
  onChange,
  uploadType,
  instructions,
  previewSize = 'small'
}: {
  label: string
  value: string
  onChange: (url: string) => void
  uploadType: string
  instructions: string
  previewSize?: 'small' | 'large'
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', uploadType)

      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        onChange(result.url)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err) {
      setError('Failed to upload file')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    } else {
      setError('Please drop an image file')
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  const previewSizeClass = previewSize === 'large'
    ? 'w-full h-32'
    : 'w-16 h-16'

  return (
    <div id={`file-upload-${uploadType}`} className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>

      {value ? (
        <div className="flex items-start gap-3">
          <div className={`${previewSizeClass} bg-[#0b0b0b] border border-gray-700 rounded-lg overflow-hidden flex items-center justify-center`}>
            <img
              src={value}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{value}</p>
            <div className="flex gap-2">
              <label className="cursor-pointer px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive
              ? 'border-[#d83f0a] bg-[#d83f0a]/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 text-[#d83f0a] animate-spin" />
              <span className="text-sm text-gray-400">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 mx-auto text-gray-500 mb-2" />
              <p className="text-sm text-gray-400 mb-1">
                Drag & drop or{' '}
                <label className="text-[#d83f0a] cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">{instructions}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

// Feature Value Cell Component
function FeatureValueCell({
  value,
  packageId,
  featureId,
  onUpdate
}: {
  value: FeatureValue | undefined
  packageId: number
  featureId: number
  onUpdate: (packageId: number, featureId: number, updates: Partial<FeatureValue>) => void
}) {
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [textValue, setTextValue] = useState(value?.text_value || '')

  const valueType = value?.value_type || 'check'
  const isChecked = value?.is_checked === 1

  const handleTypeChange = (newType: 'check' | 'dropdown' | 'text') => {
    onUpdate(packageId, featureId, {
      value_type: newType,
      is_checked: newType === 'check' ? (isChecked ? 1 : 0) : 0,
      text_value: newType === 'text' ? textValue : null
    })
    setShowTypeMenu(false)
  }

  const handleCheckToggle = () => {
    onUpdate(packageId, featureId, {
      value_type: 'check',
      is_checked: isChecked ? 0 : 1
    })
  }

  const handleTextSave = () => {
    onUpdate(packageId, featureId, {
      value_type: 'text',
      text_value: textValue
    })
    setIsEditing(false)
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      {valueType === 'check' && (
        <button
          onClick={handleCheckToggle}
          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
            isChecked
              ? 'bg-[#d83f0a] text-white'
              : 'bg-gray-800 text-gray-600 hover:bg-gray-700'
          }`}
        >
          {isChecked && <Check className="h-4 w-4" />}
        </button>
      )}

      {valueType === 'text' && (
        isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              className="w-24 px-2 py-1 text-xs bg-[#0b0b0b] border border-gray-700 rounded text-white"
              autoFocus
            />
            <button
              onClick={handleTextSave}
              className="p-1 text-green-500 hover:bg-gray-800 rounded"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 text-red-500 hover:bg-gray-800 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            {value?.text_value || 'Set text...'}
          </button>
        )
      )}

      {valueType === 'dropdown' && (
        <span className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">
          Dropdown
        </span>
      )}

      {/* Type selector */}
      <button
        onClick={() => setShowTypeMenu(!showTypeMenu)}
        className="p-1 text-gray-600 hover:text-gray-400 hover:bg-gray-800 rounded"
      >
        <Settings className="h-3 w-3" />
      </button>

      {showTypeMenu && (
        <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg z-10">
          <button
            onClick={() => handleTypeChange('check')}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-800 ${
              valueType === 'check' ? 'text-[#d83f0a]' : 'text-gray-300'
            }`}
          >
            <ToggleLeft className="h-4 w-4" />
            Check
          </button>
          <button
            onClick={() => handleTypeChange('text')}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-800 ${
              valueType === 'text' ? 'text-[#d83f0a]' : 'text-gray-300'
            }`}
          >
            <Type className="h-4 w-4" />
            Text
          </button>
          <button
            onClick={() => handleTypeChange('dropdown')}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-800 ${
              valueType === 'dropdown' ? 'text-[#d83f0a]' : 'text-gray-300'
            }`}
          >
            <ChevronDown className="h-4 w-4" />
            Dropdown
          </button>
        </div>
      )}
    </div>
  )
}
