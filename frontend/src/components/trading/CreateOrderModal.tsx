//### Path: `frontend/src/components/trading/CreateOrderModal.tsx`

// frontend/src/components/trading/CreateOrderModal.tsx
// Modal for creating new sell orders

import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrderModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { apiClient } = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    energyAmount: '',
    pricePerKwh: '',
    gridZone: 'NorthAmerica',
    energySource: 'Solar',
    expiresInBlocks: '1000'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.energyAmount || !formData.pricePerKwh) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/trades/create', {
        energyAmount: parseInt(formData.energyAmount),
        pricePerKwh: formData.pricePerKwh,
        gridZone: formData.gridZone,
        energySource: formData.energySource,
        expiresInBlocks: parseInt(formData.expiresInBlocks)
      });

      if (response.data.success) {
        alert('Sell order created successfully!');
        onSuccess();
      }
    } catch (error: any) {
      alert('Error creating order: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Sell Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Amount (kWh)
            </label>
            <input
              type="number"
              value={formData.energyAmount}
              onChange={(e) => setFormData({ ...formData, energyAmount: e.target.value })}
              placeholder="Enter amount"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per kWh (ENRG)
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.pricePerKwh}
              onChange={(e) => setFormData({ ...formData, pricePerKwh: e.target.value })}
              placeholder="Enter price"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Source
            </label>
            <select
              value={formData.energySource}
              onChange={(e) => setFormData({ ...formData, energySource: e.target.value })}
              className="input-field"
            >
              <option value="Solar">Solar</option>
              <option value="Wind">Wind</option>
              <option value="Hydro">Hydro</option>
              <option value="Geothermal">Geothermal</option>
              <option value="Battery">Battery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Zone
            </label>
            <select
              value={formData.gridZone}
              onChange={(e) => setFormData({ ...formData, gridZone: e.target.value })}
              className="input-field"
            >
              <option value="NorthAmerica">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia">Asia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires In (blocks)
            </label>
            <input
              type="number"
              value={formData.expiresInBlocks}
              onChange={(e) => setFormData({ ...formData, expiresInBlocks: e.target.value })}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Approximately {Math.floor(parseInt(formData.expiresInBlocks) / 10)} minutes
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
