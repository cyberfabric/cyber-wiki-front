/**
 * ProfilePage
 *
 * User profile with:
 * - User information
 * - Settings (cache toggle, debug toggle)
 */

import { useState, useEffect } from 'react';
import { eventBus, useAppSelector, apiRegistry, type HeaderUser } from '@cyberfabric/react';
import { AccountsApiService, type MeResponse } from '@/app/api';
import {
  Bug,
  Settings,
  CheckCircle2, User,
} from 'lucide-react';
import type { CacheSettings, UserSettings } from '@/app/api/wikiTypes';
import { loadCacheSettings, updateCacheSettings } from '@/app/actions/profileActions';
import { loadUserSettings, updateUserSettings } from '@/app/actions/userSettingsActions';
import { PageTitle } from '@/app/layout';

// ─── ProfilePage ────────────────────────────────────────────────────────────

interface ProfilePageProps {
  navigate?: (view: string) => void;
}

function ProfilePage({ navigate: _navigate }: ProfilePageProps) {
  const headerState = useAppSelector((state) => state['layout/header'] as { user?: HeaderUser } | undefined);
  const headerUser = headerState?.user ?? null;

  // ── Full user info from /me ──
  const [userInfo, setUserInfo] = useState<MeResponse | null>(null);

  // ── Cache settings state ──
  const [cacheSettings, setCacheSettings] = useState<CacheSettings | null>(null);

  // ── User (UI) settings state ── persisted to localStorage via the
  //  user/settings/* event domain. Houses developer toggles like Debug mode.
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // ── Messages ──
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const subCacheLoaded = eventBus.on('profile/cache/loaded', ({ settings }) => {
      setCacheSettings(settings);
    });
    const subCacheUpdated = eventBus.on('profile/cache/updated', ({ settings }) => {
      setCacheSettings(settings);
      setSuccess('Settings updated');
      setTimeout(() => setSuccess(null), 3000);
    });
    const subUserLoaded = eventBus.on('user/settings/loaded', ({ settings }) => {
      setUserSettings(settings);
    });
    const subUserUpdated = eventBus.on('user/settings/updated', ({ settings }) => {
      setUserSettings(settings);
      setSuccess('Settings updated');
      setTimeout(() => setSuccess(null), 3000);
    });

    loadCacheSettings();
    loadUserSettings();

    apiRegistry.getService(AccountsApiService).me.fetch().then((me) => {
      if (me) setUserInfo(me);
    }).catch(() => { /* ignore */ });

    return () => {
      subCacheLoaded.unsubscribe();
      subCacheUpdated.unsubscribe();
      subUserLoaded.unsubscribe();
      subUserUpdated.unsubscribe();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      <PageTitle title="Profile" subtitle="User information and application settings" />

      {success && (
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center gap-2 p-3 rounded-md border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle2 size={16} />
            {success}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
        {/* ═══ User Info ═══ */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Field</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                  <User size={14} className="inline mr-2 text-muted-foreground" />
                  Username
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{userInfo?.username || '—'}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">Email</td>
                <td className="px-4 py-3 text-sm text-foreground">{userInfo?.email || headerUser?.email || '—'}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">Display Name</td>
                <td className="px-4 py-3 text-sm text-foreground">{headerUser?.displayName || '—'}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">Role</td>
                <td className="px-4 py-3 text-sm text-foreground capitalize">{userInfo?.role || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ═══ Settings ═══ */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                  <Settings size={14} className="inline mr-2" />
                  Setting
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">Cache API responses</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">Store API responses in the database for faster development</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (cacheSettings) {
                        updateCacheSettings({ cache_enabled: !cacheSettings.cache_enabled });
                      }
                    }}
                    disabled={!cacheSettings}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                      cacheSettings?.cache_enabled ? 'bg-primary' : 'bg-input'
                    }`}
                    role="switch"
                    aria-checked={cacheSettings?.cache_enabled ?? false}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                        cacheSettings?.cache_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                  <Bug size={14} className="inline mr-2 text-muted-foreground" />
                  Debug mode
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  Reveal developer-only affordances: raw enrichment payload viewer (Debug tab in the file panel) and other future devtools.
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (userSettings) {
                        updateUserSettings({ debugMode: !userSettings.debugMode });
                      }
                    }}
                    disabled={!userSettings}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                      userSettings?.debugMode ? 'bg-primary' : 'bg-input'
                    }`}
                    role="switch"
                    aria-checked={userSettings?.debugMode ?? false}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                        userSettings?.debugMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
