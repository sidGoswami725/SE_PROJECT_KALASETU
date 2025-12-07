import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. Mock ResizeObserver (Required by many UI components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 2. Mock LocalStorage (Used by Auth and Profile features)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// 3. Mock Navigation (React Router)
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    // Default params allow Feature 6 (ArtisanDetails) and Feature 9 (PitchDetails) to load without crashing
    useParams: () => ({ pitchId: 'p1', artisanUid: 'u1', businessId: 'b1' }), 
  };
});

// 4. Mock Toast Notifications (Used across all 12 features)
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// 5. Mock Window Interactions (Crucial for Feature 5, 9, 11)
// Your components use prompt() for inputs like investment amounts or collab messages
window.prompt = vi.fn(() => "Test Input Value"); 
window.confirm = vi.fn(() => true); // Always click "Yes" on confirmations
window.scrollTo = vi.fn(); // Prevent errors in Chat (Feature 12) auto-scroll

// 6. Mock matchMedia (Required by Shadcn/Radix UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});