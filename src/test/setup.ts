import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {
    // no-op for jsdom
  }

  unobserve() {
    // no-op for jsdom
  }

  disconnect() {
    // no-op for jsdom
  }
}

const storage = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return storage.size;
  },
  clear() {
    storage.clear();
  },
  getItem(key: string) {
    return storage.has(key) ? storage.get(key)! : null;
  },
  key(index: number) {
    return Array.from(storage.keys())[index] ?? null;
  },
  removeItem(key: string) {
    storage.delete(key);
  },
  setItem(key: string, value: string) {
    storage.set(key, value);
  },
};

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});
