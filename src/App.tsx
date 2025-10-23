import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import ProposalSystem from './components/ProposalSystem';
import { PublicProposalView } from './components/PublicProposalView';
import { Loader2 } from 'lucide-react';

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  const path = window.location.pathname;
  const shareMatch = path.match(/^\/share\/([a-f0-9]+)$/);

  if (shareMatch) {
    const shareToken = shareMatch[1];
    return <PublicProposalView shareToken={shareToken} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return <ProposalSystem />;
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
