// frontend/src/components/layout/Header.tsx
// Main navigation header with wallet connection

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePolkadot } from '../../context/PolkadotContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { isConnected, selectedAccount, connectWallet, disconnectWallet, accounts, selectAccount } = usePolkadot();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Trading', path: '/trading' },
    { name: 'Staking', path: '/staking' },
    { name: 'Devices', path: '/devices' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Analytics', path: '/analytics' },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg"></div>
              <span className="text-xl font-bold text-gradient">EnergiDot</span>
            </Link>

            <div className="hidden md:flex ml-10 space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    location.pathname === item.path
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && selectedAccount ? (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {formatAddress(selectedAccount.address)}
                  </span>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Connected Account</p>
                      <p className="text-sm font-medium truncate">{selectedAccount.address}</p>
                    </div>

                    {accounts.length > 1 && (
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Switch Account</p>
                        {accounts.map((account) => (
                          <button
                            key={account.address}
                            onClick={() => {
                              selectAccount(account);
                              setShowAccountMenu(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-sm rounded ${
                              account.address === selectedAccount.address
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {account.meta.name || formatAddress(account.address)}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="btn-primary"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;