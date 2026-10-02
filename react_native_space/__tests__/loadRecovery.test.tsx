import { act, renderHook } from '@testing-library/react-native';
import { useLoadSection } from '../src/hooks/useLoadSection';

const failure = (status?: number) => Promise.reject(status ? { response: { status } } : new Error('offline'));
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; };

describe('scoped section recovery with synthetic requests', () => {
  it('distinguishes failed initial load from a successful empty response and retries', async () => {
    const { result } = renderHook(() => useLoadSection<string[]>('alice'));
    await act(async () => { await result.current.load(() => failure()); });
    expect(result.current.data).toBeUndefined(); expect(result.current.error).toBe('request');
    await act(async () => { await result.current.load(() => Promise.resolve([])); });
    expect(result.current.data).toEqual([]); expect(result.current.error).toBeNull();
  });
  it('keeps loaded content while refreshing and after a refresh failure', async () => {
    const { result } = renderHook(() => useLoadSection<string[]>('alice'));
    await act(async () => { await result.current.load(() => Promise.resolve(['bottle'])); });
    const request = deferred<string[]>(); let pending!: Promise<void>;
    act(() => { pending = result.current.load(() => request.promise); });
    expect(result.current.data).toEqual(['bottle']); expect(result.current.loading).toBe(true);
    await act(async () => { request.resolve(['bottle']); await pending; });
    await act(async () => { await result.current.load(() => failure(503)); });
    expect(result.current.data).toEqual(['bottle']); expect(result.current.error).toBe('request');
  });
  it('handles partial section failure independently', async () => {
    const { result } = renderHook(() => ({ pours: useLoadSection<string[]>('alice'), radar: useLoadSection<string[]>('alice') }));
    await act(async () => { await Promise.all([result.current.pours.load(() => Promise.resolve(['pour'])), result.current.radar.load(() => failure())]); });
    expect(result.current.pours.data).toEqual(['pour']); expect(result.current.radar.error).toBe('request');
  });
  it('clears rejected authentication data and distinguishes not found only on detail requests', async () => {
    const { result } = renderHook(() => useLoadSection<string[]>('alice', true));
    await act(async () => { await result.current.load(() => Promise.resolve(['private'])); });
    await act(async () => { await result.current.load(() => failure(401)); });
    expect(result.current.error).toBe('auth'); expect(result.current.data).toBeUndefined();
    await act(async () => { await result.current.load(() => failure(404)); });
    expect(result.current.error).toBe('not-found');
  });
  it('treats a list 404 and forbidden request as request failures, never empty success', async () => {
    const { result } = renderHook(() => useLoadSection<string[]>('alice'));
    for (const status of [404, 403]) { await act(async () => { await result.current.load(() => failure(status)); }); expect(result.current.error).toBe('request'); expect(result.current.data).toBeUndefined(); }
  });
  it('hides old account data immediately and discards late responses', async () => {
    const { result, rerender } = renderHook(({ scope }: { scope: string }) => useLoadSection<string[]>(scope), { initialProps: { scope: 'alice' } });
    await act(async () => { await result.current.load(() => Promise.resolve(['alice'])); });
    const request = deferred<string[]>(); let pending!: Promise<void>;
    act(() => { pending = result.current.load(() => request.promise); });
    rerender({ scope: 'bob' }); expect(result.current.data).toBeUndefined();
    await act(async () => { await result.current.load(() => Promise.resolve(['bob'])); });
    await act(async () => { request.resolve(['late alice']); await pending; });
    expect(result.current.data).toEqual(['bob']);
  });
  it('does not restore cached data after leaving and reentering the same account scope', async () => {
    const { result, rerender } = renderHook(({ scope }: { scope: string }) => useLoadSection<string[]>(scope), { initialProps: { scope: 'alice' } });
    await act(async () => { await result.current.load(() => Promise.resolve(['alice'])); });
    const old = result.current;
    rerender({ scope: 'bob' }); rerender({ scope: 'alice' });
    expect(result.current.data).toBeUndefined();
    await act(async () => { old.setData(['stale mutation']); await old.load(() => Promise.resolve(['stale retry'])); });
    expect(result.current.data).toBeUndefined();
  });
  it('rejects an older overlapping request and an older route result', async () => {
    const { result, rerender } = renderHook(({ scope }: { scope: string }) => useLoadSection<string[]>(scope), { initialProps: { scope: 'alice:distillery1' } });
    const request = deferred<string[]>(); let pending!: Promise<void>;
    act(() => { pending = result.current.load(() => request.promise); });
    await act(async () => { await result.current.load(() => Promise.resolve(['new'])); });
    await act(async () => { request.resolve(['old']); await pending; });
    expect(result.current.data).toEqual(['new']);
    rerender({ scope: 'alice:distillery2' }); expect(result.current.data).toBeUndefined();
  });
  it('makes no request while logged out', async () => {
    const request = jest.fn(); const { result } = renderHook(() => useLoadSection<string[]>(null));
    await act(async () => { await result.current.load(request); });
    expect(request).not.toHaveBeenCalled(); expect(result.current.error).toBe('auth');
  });
});
