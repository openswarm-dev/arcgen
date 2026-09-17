'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { fetchWalletBalance } from '../../lib/api';
import {
  clearStoredWalletSelection,
  disconnectAllExtensionProviders,
  disconnectExtensionProvider,
  prepareWalletConnect,
  truncateAddress
} from '../../lib/wallet';
import styles from './ConnectWallet.module.css';

function useClickOutside(ref, handler, active) {
  useEffect(() => {
    if (!active) return undefined;

    const onPointerDown = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [ref, handler, active]);
}

export default function ConnectWallet({ variant = 'navbar' }) {
  const rootRef = useRef(null);
  const { wallets, select, connect, disconnect, publicKey, connected, connecting, wallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [pendingWalletName, setPendingWalletName] = useState(null);

  const address = connected && publicKey ? publicKey.toBase58() : null;
  const isConnected = connected && Boolean(publicKey);
  const availableWallets = wallets.filter(
    w => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
  );

  const closeMenus = useCallback(() => {
    setMenuOpen(false);
    setConnectOpen(false);
  }, []);

  useClickOutside(rootRef, closeMenus, menuOpen || connectOpen);

  const loadBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setBalanceLoading(true);
    setBalanceError(false);

    try {
      const data = await fetchWalletBalance(address);
      setBalance(data);
    } catch {
      setBalanceError(true);
    } finally {
      setBalanceLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(null);
      return undefined;
    }

    loadBalance();
    const interval = setInterval(loadBalance, 30_000);
    return () => clearInterval(interval);
  }, [isConnected, address, loadBalance]);

  useEffect(() => {
    if (menuOpen && isConnected) {
      loadBalance();
    }
  }, [menuOpen, isConnected, loadBalance]);

  useEffect(() => {
    if (!pendingWalletName || wallet?.adapter.name !== pendingWalletName) {
      return undefined;
    }

    let active = true;

    (async () => {
      try {
        await prepareWalletConnect(wallet.adapter);
        await connect();
        if (active) {
          setConnectOpen(false);
        }
      } catch {
        select(null);
        clearStoredWalletSelection();
      } finally {
        if (active) {
          setPendingWalletName(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [pendingWalletName, wallet, connect, select]);

  const handleConnectClick = () => {
    if (isConnected) {
      setConnectOpen(false);
      setMenuOpen(open => !open);
      return;
    }

    setMenuOpen(false);
    setPendingWalletName(null);
    select(null);
    clearStoredWalletSelection();
    setConnectOpen(true);
  };

  const handleSelectWallet = selectedWallet => {
    setPendingWalletName(selectedWallet.adapter.name);
    select(selectedWallet.adapter.name);
  };

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDisconnect = async () => {
    closeMenus();
    setPendingWalletName(null);
    setBalance(null);

    const adapterName = wallet?.adapter?.name;

    try {
      await disconnect();
    } catch {
      // continue clearing local/extension state
    }

    if (adapterName) {
      await disconnectExtensionProvider(adapterName);
    }

    await disconnectAllExtensionProviders();
    select(null);
    clearStoredWalletSelection();
  };

  const rootClass = `${styles.root} ${variant === 'menu' ? styles.menuVariant : ''}`;

  return (
    <div ref={rootRef} className={rootClass}>
      <button
        type="button"
        className={`${isConnected ? styles.trigger : styles.connectButton} ${isConnected ? styles.triggerConnected : ''}`}
        onClick={handleConnectClick}
        disabled={connecting}
        aria-expanded={menuOpen || connectOpen}
        aria-haspopup="menu"
      >
        {connecting ? (
          'Connecting...'
        ) : isConnected && address ? (
          <>
            {wallet?.adapter.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wallet.adapter.icon} alt="" className={styles.walletIcon} />
            ) : null}
            <span>{truncateAddress(address)}</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          'Connect wallet'
        )}
      </button>

      {connectOpen && !isConnected ? (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <div className={styles.menuTitle}>Connect a wallet</div>
          </div>
          {availableWallets.length > 0 ? (
            <div className={styles.walletList}>
              {availableWallets.map(item => (
                <button
                  key={item.adapter.name}
                  type="button"
                  className={styles.walletOption}
                  onClick={() => handleSelectWallet(item)}
                  disabled={connecting}
                >
                  {item.adapter.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.adapter.icon} alt="" className={styles.walletOptionIcon} />
                  ) : null}
                  <span>{item.adapter.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No Solana wallets detected. Install{' '}
              <a href="https://phantom.app/" target="_blank" rel="noreferrer">
                Phantom
              </a>{' '}
              or{' '}
              <a href="https://solflare.com/" target="_blank" rel="noreferrer">
                Solflare
              </a>{' '}
              to continue.
            </div>
          )}
        </div>
      ) : null}

      {menuOpen && isConnected ? (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <div className={styles.menuTitle}>Wallet</div>
            <div className={styles.balanceBlock}>
              {balanceLoading && !balance ? (
                <div className={styles.balanceLoading}>Loading balance...</div>
              ) : balanceError ? (
                <div className={styles.balanceError}>Could not load balance</div>
              ) : balance ? (
                <>
                  <div className={styles.balanceSol}>{balance.solFormatted}</div>
                  {balance.usdFormatted ? (
                    <div className={styles.balanceUsd}>({balance.usdFormatted})</div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
          <div className={styles.menuBody}>
            <button type="button" className={styles.menuItem} onClick={handleCopy}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={styles.menuItemIcon} aria-hidden="true">
                <rect x="8" y="8" width="12" height="12" rx="2" />
                <path d="M6 16V6a2 2 0 012-2h10" />
              </svg>
              {copied ? 'Copied!' : 'Copy address'}
            </button>
            <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleDisconnect}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={styles.menuItemIcon} aria-hidden="true">
                <path d="M15 12H3" />
                <path d="M18 9l3 3-3 3" />
                <path d="M21 12H9" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
