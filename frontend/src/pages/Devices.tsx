//### Path: `frontend/src/pages/Devices.tsx`

// frontend/src/pages/Devices.tsx
// STEP I.03 - Device registration and verification interface

import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { usePolkadot } from '../context/PolkadotContext';

interface Device {
  id: number;
  device_type: string;
  capacity_kwh: number;
  verified: boolean;
  did_reference: string;
  registered_at: string;
}

const Devices: React.FC = () => {
  const { apiClient } = useApi();
  const { isConnected, selectedAccount } = usePolkadot();
  const [devices, setDevices] = useState<Device[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    deviceType: 'Solar',
    capacityKwh: '',
    didReference: ''
  });

  useEffect(() => {
    if (isConnected && selectedAccount) {
      fetchDevices();
    }
  }, [isConnected, selectedAccount]);

  const fetchDevices = async () => {
    try {
      const response = await apiClient.get('/api/v1/devices/list');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.capacityKwh || !formData.didReference) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await apiClient.post('/api/v1/devices/register', {
        deviceType: formData.deviceType,
        capacityKwh: parseInt(formData.capacityKwh),
        didReference: formData.didReference
      });

      if (response.data.success) {
        alert('Device registered successfully!');
        setShowRegisterModal(false);
        setFormData({ deviceType: 'Solar', capacityKwh: '', didReference: '' });
        fetchDevices();
      }
    } catch (error: any) {
      alert('Error registering device: ' + (error.response?.data?.error || error.message));
    }
  };

  const getDeviceIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      Solar: '☀️',
      Wind: '💨',
      Hydro: '💧',
      Geothermal: '🌋',
      Battery: '🔋'
    };
    return icons[type] || '⚡';
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to register and manage devices
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Energy Devices</h1>
          <p className="mt-2 text-gray-600">
            Register and verify your energy-producing devices
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn-primary"
        >
          Register Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <p className="text-gray-600">No devices registered yet</p>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="btn-primary mt-4"
            >
              Register Your First Device
            </button>
          </div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{getDeviceIcon(device.device_type)}</div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    device.verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {device.verified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {device.device_type}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium">{device.capacity_kwh} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registered</span>
                  <span className="font-medium">
                    {new Date(device.registered_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DID</span>
                  <span className="font-medium text-xs truncate ml-2">
                    {device.did_reference.slice(0, 8)}...
                  </span>
                </div>
              </div>

              {!device.verified && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    Device is pending verification. This may take 24-48 hours.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Register Device</h2>

            <form onSubmit={handleRegisterDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type
                </label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                  className="input-field"
                >
                  <option value="Solar">Solar Panel</option>
                  <option value="Wind">Wind Turbine</option>
                  <option value="Hydro">Hydro Generator</option>
                  <option value="Geothermal">Geothermal</option>
                  <option value="Battery">Battery Storage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (kWh)
                </label>
                <input
                  type="number"
                  value={formData.capacityKwh}
                  onChange={(e) => setFormData({ ...formData, capacityKwh: e.target.value })}
                  placeholder="Enter capacity"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DID Reference
                </label>
                <input
                  type="text"
                  value={formData.didReference}
                  onChange={(e) => setFormData({ ...formData, didReference: e.target.value })}
                  placeholder="Enter DID reference"
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your decentralized identity reference for device verification
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
