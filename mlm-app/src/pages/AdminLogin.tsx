import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Test request to verify the token
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/listings?limit=1`, {
        headers: {
          'x-admin-token': password,
        }
      });
      
      if (!res.ok) {
        throw new Error('Invalid token');
      }
      
      // Store token and redirect
      sessionStorage.setItem('admin_token', password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError('Invalid token');
    }
  };

  return (
    <div className="min-h-screen bg-[#080604] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#12100d] p-8 rounded-lg border border-[#c9a96e]/10 w-full max-w-sm">
        <h1 className="text-[#e8dcc8] text-2xl font-serif mb-6 text-center">Admin Access</h1>
        
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter secret token"
          className="w-full bg-black/50 border border-[#c9a96e]/20 rounded p-3 mb-4 text-[#e8dcc8] focus:outline-none focus:border-[#c9a96e]/50"
          autoFocus
        />
        
        <button
          type="submit"
          className="w-full bg-[#c9a96e] text-black font-medium py-3 rounded hover:bg-[#d4b986] transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}
