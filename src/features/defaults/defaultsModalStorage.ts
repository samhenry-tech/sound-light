import { APP_NAME } from '~/constants';

const DISMISS_KEY = `${APP_NAME}.dismissed-default-playlists`;

/** Whether the user dismissed the empty-library defaults modal. */
export const readDefaultsModalDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeDefaultsModalDismissed = (dismissed: boolean): void => {
  try {
    if (dismissed) localStorage.setItem(DISMISS_KEY, '1');
    else localStorage.removeItem(DISMISS_KEY);
  } catch {
    // ignore quota / private mode
  }
};
