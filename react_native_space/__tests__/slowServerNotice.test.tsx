import React from 'react';
import { act, render } from '@testing-library/react-native';
import { SLOW_SERVER_MESSAGE, SlowServerNotice } from '../src/components/SlowServerNotice';

describe('slow server notice (fake timers)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('appears only after about 8 seconds of waiting and clears when the request ends', () => {
    const view = render(<SlowServerNotice active />);
    act(() => { jest.advanceTimersByTime(7900); });
    expect(view.queryByText(SLOW_SERVER_MESSAGE)).toBeNull();
    act(() => { jest.advanceTimersByTime(200); });
    expect(view.getByText('Waking the server — the first load can take up to a minute.')).toBeTruthy();

    view.rerender(<SlowServerNotice active={false} />);
    expect(view.queryByText(SLOW_SERVER_MESSAGE)).toBeNull();

    view.rerender(<SlowServerNotice active />);
    expect(view.queryByText(SLOW_SERVER_MESSAGE)).toBeNull();
  });

  it('never appears for a request that finishes quickly', () => {
    const view = render(<SlowServerNotice active />);
    act(() => { jest.advanceTimersByTime(3000); });
    view.rerender(<SlowServerNotice active={false} />);
    act(() => { jest.advanceTimersByTime(10000); });
    expect(view.queryByText(SLOW_SERVER_MESSAGE)).toBeNull();
  });
});
