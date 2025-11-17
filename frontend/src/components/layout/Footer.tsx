// frontend/src/components/layout/Footer.tsx
// Application footer

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">About EnergiDot</h3>
            <p className="text-sm text-gray-600">
              Decentralized energy grid management on Polkadot, enabling peer-to-peer renewable energy trading.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600">Documentation</a></li>
              <li><a href="#" className="hover:text-primary-600">API Reference</a></li>
              <li><a href="#" className="hover:text-primary-600">GitHub</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600">Discord</a></li>
              <li><a href="#" className="hover:text-primary-600">Twitter</a></li>
              <li><a href="#" className="hover:text-primary-600">Forum</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Data Sources</h3>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>NREL, OPSD, EIA</li>
              <li>ENTSO-E, NOAA</li>
              <li>Copernicus, OpenWeatherMap</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Built on Polkadot SDK | Powered by Substrate FRAME
          </p>
          <p className="text-xs text-gray-400 mt-2">
            2025 EnergiDot. Production-ready DePIN + DAG implementation.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;