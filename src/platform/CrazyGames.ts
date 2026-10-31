/**
 * Thin wrapper around the CrazyGames SDK v2.
 * Every method is a safe no-op when the SDK is absent (local dev, publishing
 * on your own site, offline), so the game can be shipped identically in both
 * environments.
 *
 * Docs: https://docs.crazygames.com/sdk/html5-v2/
 */

type AdType = 'midgame' | 'rewarded';

interface CrazyGamesSdkShape {
  init?: () => Promise<void> | void;
  game: {
    gameplayStart: () => void;
    gameplayStop: () => void;
    happytime: () => void;
    loadingStart: () => void;
    loadingStop: () => void;
    sdkGameLoadingStart?: () => void;
    sdkGameLoadingStop?: () => void;
  };
  ad: {
    requestAd: (
      type: AdType,
      callbacks: {
        adStarted?: () => void;
        adFinished?: () => void;
        adError?: (err: unknown) => void;
      }
    ) => void;
  };
  user?: {
    isUserAccountAvailable?: () => Promise<boolean>;
    getUser?: () => Promise<{ username?: string; profilePictureUrl?: string }>;
  };
  data?: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  banner?: {
    requestBanner?: (opts: unknown) => Promise<void>;
    clearAllBanners?: () => void;
  };
}

interface SdkHolder {
  SDK?: CrazyGamesSdkShape;
  CrazyGames?: { SDK?: CrazyGamesSdkShape };
}

function resolveSdk(): CrazyGamesSdkShape | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as SdkHolder;
  return w.CrazyGames?.SDK || w.SDK || null;
}

/** Guard flag used to avoid stacking ad requests. */
let adInFlight = false;

export const crazy = {
  isAvailable(): boolean {
    return !!resolveSdk();
  },

  /**
   * Called once at app boot. Reports loading start → stop so CrazyGames shows
   * their native loader instead of a blank frame.
   */
  async init(): Promise<void> {
    const sdk = resolveSdk();
    if (!sdk) return;
    try {
      sdk.game.sdkGameLoadingStart?.();
      await sdk.init?.();
      sdk.game.sdkGameLoadingStop?.();
    } catch (e) {
      // Swallow — never break the game because the SDK had a hiccup.
      console.warn('[CrazyGames] init failed', e);
    }
  },

  /** The player entered an active round. Mandatory for revenue. */
  gameplayStart(): void {
    resolveSdk()?.game.gameplayStart();
  },

  /** The player left an active round (victory, defeat, pause, menu). */
  gameplayStop(): void {
    resolveSdk()?.game.gameplayStop();
  },

  /**
   * Signals a "good moment" to show a non-blocking supplement ad — e.g.
   * stage victory. Only triggers an ad roughly once every few minutes.
   */
  happytime(): void {
    resolveSdk()?.game.happytime();
  },

  /**
   * Full-screen interstitial ad. Mutes the game while playing. Returns
   * a promise so callers can await before continuing the next stage.
   */
  requestMidgameAd(): Promise<void> {
    return new Promise((resolve) => {
      const sdk = resolveSdk();
      if (!sdk || adInFlight) {
        resolve();
        return;
      }
      adInFlight = true;
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        adInFlight = false;
        resolve();
      };
      try {
        sdk.ad.requestAd('midgame', {
          adStarted: () => {},
          adFinished: done,
          adError: done,
        });
      } catch (e) {
        console.warn('[CrazyGames] midgame ad failed', e);
        done();
      }
      // Safety timeout so a stuck SDK can't freeze the game.
      setTimeout(done, 30000);
    });
  },

  /**
   * Rewarded ad — only resolves to `true` on successful completion.
   * The caller should only grant the reward if the result is true.
   */
  requestRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      const sdk = resolveSdk();
      if (!sdk || adInFlight) {
        resolve(false);
        return;
      }
      adInFlight = true;
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        adInFlight = false;
        resolve(ok);
      };
      try {
        sdk.ad.requestAd('rewarded', {
          adFinished: () => done(true),
          adError: () => done(false),
        });
      } catch {
        done(false);
      }
      setTimeout(() => done(false), 60000);
    });
  },
};
