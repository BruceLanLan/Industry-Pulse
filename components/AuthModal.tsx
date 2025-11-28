import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API Call
    setTimeout(() => {
        onLogin({
            id: 'user_123',
            name: name || 'Demo User',
            email: email,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        });
        onClose();
    }, 1000);
  };

  const handleGoogleLogin = () => {
      // Simulate Google Auth
      setTimeout(() => {
          onLogin({
              id: 'google_123',
              name: 'Google User',
              email: 'user@gmail.com',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google'
          });
          onClose();
      }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
                {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>
        </div>

        <div className="p-6">
            <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-colors mb-4"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
            </button>

            <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <span className="relative bg-white px-4 text-xs text-gray-400 uppercase">Or continue with email</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                        type="password" 
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-2"
                >
                    {isRegister ? 'Create Account' : 'Sign In'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button 
                    onClick={() => setIsRegister(!isRegister)}
                    className="ml-1 text-blue-600 font-medium hover:underline"
                >
                    {isRegister ? 'Sign in' : 'Register'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
