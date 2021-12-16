import * as React from 'react';

import {
  getPendingDeepLink,
  addDeepLinkListener,
  loadApp,
} from '../../../native-modules/DevLauncherInternal';
import { render, act, waitFor, fireEvent } from '../../../test-utils';
import { DevSession } from '../../../types';
import { DeepLinkModal } from '../DeepLinkModal';

const mockGetPendingDeepLink = getPendingDeepLink as jest.Mock;
const mockAddDeepLinkListener = addDeepLinkListener as jest.Mock;
const mockLoadApp = loadApp as jest.Mock;

const fakeLocalPackager: DevSession = {
  url: 'hello',
  description: 'fakePackagerDescription',
  source: 'test',
};

describe('<DeepLinkPrompt />', () => {
  afterEach(() => {
    mockGetPendingDeepLink.mockClear();
    mockAddDeepLinkListener.mockClear();
    mockLoadApp.mockClear();
  });

  test('retrieves pending deep link on mount and displays in modal', async () => {
    const fakeDeepLink = 'testing-testing-123';
    mockGetPendingDeepLink.mockResolvedValueOnce(fakeDeepLink);

    expect(getPendingDeepLink).not.toHaveBeenCalled();

    const { getByText, queryByText } = render(null);

    expect(queryByText(fakeDeepLink)).toBe(null);

    await act(async () => {
      expect(getPendingDeepLink).toHaveBeenCalled();
      await waitFor(() => getByText(fakeDeepLink));
    });
  });

  test('shows packagers in modal', async () => {
    const { getByText, queryByText } = render(<DeepLinkModal pendingDeepLink="123" />, {
      initialAppProviderProps: { initialDevSessions: [fakeLocalPackager] },
    });

    expect(queryByText(fakeLocalPackager.description)).toBe(null);

    await act(async () => {
      await waitFor(() => getByText(fakeLocalPackager.description));
    });
  });

  test('packagers in modal call loadApp() when pressed', async () => {
    const { getByText } = render(<DeepLinkModal pendingDeepLink="123" />, {
      initialAppProviderProps: { initialDevSessions: [fakeLocalPackager] },
    });

    await act(async () => {
      expect(loadApp).not.toHaveBeenCalled();

      const button = await waitFor(() => getByText(fakeLocalPackager.description));
      fireEvent.press(button);

      expect(loadApp).toHaveBeenCalled();
    });
  });

  test('shows empty message when no packagers are found', async () => {
    const { getByText, queryByText } = render(<DeepLinkModal pendingDeepLink="123" />, {
      initialAppProviderProps: { initialDevSessions: [], initialRecentlyOpenedApps: [] },
    });

    expect(queryByText(/unable to find any packagers/i)).toBe(null);

    await act(async () => {
      expect(queryByText(/unable to find any packagers/i)).toBe(null);
      await waitFor(() => getByText(/unable to find any packagers/i));
    });
  });

  test('calls subscription on mount', async () => {
    expect(addDeepLinkListener).not.toHaveBeenCalled();

    render(null);

    await act(async () => {
      expect(addDeepLinkListener).toHaveBeenCalled();
    });
  });
});
