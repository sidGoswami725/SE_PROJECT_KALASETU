import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Import Pages
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AITools from './pages/AITools';
import MyBusiness from './pages/MyBusiness';
import MyMentors from './pages/MyMentors';
import ArtisanDetails from './pages/ArtisanDetails';
import Marketplace from './pages/Marketplace';
import PitchDetails from './pages/PitchDetails';
import Forum from './pages/Forum';
import Collaborations from './pages/Collaborations';
import Chat from './pages/Chat';

// --- MOCKS ---
// We mock the API to prevent real backend calls
vi.mock('@/lib/api', () => ({
  signup: vi.fn(() => Promise.resolve({ uid: '123' })),
  getProfile: vi.fn(() => Promise.resolve({ name: 'Test User', skills: ['Weaving'] })),
  updateProfile: vi.fn(() => Promise.resolve({})),
  getUserPosts: vi.fn(() => Promise.resolve([])),
  getUserCommunities: vi.fn(() => Promise.resolve([])),
  getIdeas: vi.fn(() => Promise.resolve(['Bamboo Lamp', 'Jute Bag'])),
  getSchemes: vi.fn(() => Promise.resolve([])),
  generateImage: vi.fn(() => Promise.resolve({ url: 'http://img.com' })),
  getBusinesses: vi.fn(() => Promise.resolve([])),
  getCollaborators: vi.fn(() => Promise.resolve([])),
  createBusiness: vi.fn(() => Promise.resolve({})),
  getConnectedMentors: vi.fn(() => Promise.resolve([{uid: 'm1', name: 'Mentor A'}])),
  verifyBusiness: vi.fn(() => Promise.resolve({})),
  listPitches: vi.fn(() => Promise.resolve([{id: 'p1', pitch_title: 'Eco Pitch', funding_goal: 1000, current_funding: 500}])),
  createPitch: vi.fn(() => Promise.resolve({})),
  getPitchDetails: vi.fn(() => Promise.resolve({
    pitch_title: 'Eco Pitch', funding_goal: 1000, current_funding: 500, 
    interested_investors: [], interested_investors_details: [], owner_uids: []
  })),
  fundPitch: vi.fn(() => Promise.resolve({})),
  getForumPosts: vi.fn(() => Promise.resolve([{id: '1', title: 'Forum Post 1', body: 'Content', score: 10}])),
  createForumPost: vi.fn(() => Promise.resolve({})),
  getCollabRequests: vi.fn(() => Promise.resolve({received: [], sent: []})),
  sendCollab: vi.fn(() => Promise.resolve({})),
  getConversations: vi.fn(() => Promise.resolve([])),
  sendMessage: vi.fn(() => Promise.resolve({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: '123' } })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: '123' } }))
}));

// Helper to render pages with specific URL history
const renderWithRouter = (component: React.ReactNode, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/*" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

describe('KalaSetu Top 12 Features Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('kalasetu_user', JSON.stringify({ uid: 'u1', role: 'artisan', name: 'Test' }));
  });

  // Feature 1: Registration (1.01)
  it('Feature 1: Renders Signup form directly', () => {
    // FIX: We load the URL with ?mode=signup directly so we don't depend on button clicks
    renderWithRouter(<Auth />, ['/auth?mode=signup']);
    
    // Now this text should exist immediately
    expect(screen.getByText(/Join KalaSetu/i)).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    expect(emailInput).toHaveValue('test@test.com');
  });

  // Feature 2: Profile (1.02)
  it('Feature 2: Displays user profile data', async () => {
    renderWithRouter(<Profile />);
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
  });

  // Feature 3: AI Ideation (2.01)
  it('Feature 3: Generates ideas when button clicked', async () => {
    renderWithRouter(<AITools />);
    const btn = screen.getByText(/Generate New Ideas/i);
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Bamboo Lamp')).toBeInTheDocument());
  });

  // Feature 4: Business Creation (3.01)
  it('Feature 4: Renders Business Form', async () => {
    renderWithRouter(<MyBusiness />);
    // Check for the "Create Business Profile" button
    expect(screen.getByText(/Create Business Profile/i)).toBeInTheDocument();
  });

  // Feature 5: Mentorship Request (3.02)
  it('Feature 5: Displays connected mentors', async () => {
    renderWithRouter(<MyMentors />);
    await waitFor(() => expect(screen.getByText('Mentor A')).toBeInTheDocument());
  });

  // Feature 6: Mentor Verification (3.03)
  it('Feature 6: Renders verification button', async () => {
    localStorage.setItem('kalasetu_user', JSON.stringify({ uid: 'm1', role: 'mentor' }));
    renderWithRouter(<ArtisanDetails />);
    // Since we mocked useParams in setupTests, it loads successfully
    await waitFor(() => expect(screen.getByText(/Review Businesses/i)).toBeInTheDocument());
  });

  // Feature 7: Pitch Creation (4.01)
  it('Feature 7: Pitch Modal Trigger', async () => {
    localStorage.setItem('pitch_context', JSON.stringify({ businessId: '1', businessName: 'Biz' }));
    renderWithRouter(<Marketplace />);
    // Dialog should open automatically due to context
    await waitFor(() => expect(screen.getByText(/Create Your Pitch/i)).toBeInTheDocument());
  });

  // Feature 8: Marketplace Discovery (4.02)
  it('Feature 8: Lists active pitches', async () => {
    renderWithRouter(<Marketplace />);
    await waitFor(() => expect(screen.getByText('Eco Pitch')).toBeInTheDocument());
  });

  // Feature 9: Investment (4.03)
  it('Feature 9: Renders Fund button', async () => {
    localStorage.setItem('kalasetu_user', JSON.stringify({ uid: 'i1', role: 'investor' }));
    renderWithRouter(<PitchDetails />);
    await waitFor(() => expect(screen.getByText(/Fund this Business/i)).toBeInTheDocument());
  });

  // Feature 10: Forum (5.01)
  it('Feature 10: Lists forum posts', async () => {
    renderWithRouter(<Forum />);
    await waitFor(() => expect(screen.getByText('Forum Post 1')).toBeInTheDocument());
  });

  // Feature 11: Collaboration (5.03)
  it('Feature 11: Renders collaboration search', () => {
    renderWithRouter(<Collaborations />);
    expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();
  });

  // Feature 12: Chat (5.04)
  it('Feature 12: Allows typing a message', () => {
    renderWithRouter(<Chat />);
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input).toHaveValue('Hello');
  });
});