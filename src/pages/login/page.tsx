import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      navigate(from || '/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img 
              src="https://static.readdy.ai/image/acf8fc365223a7d2bd60db95c29d6240/ea3b02d7dfa7aa2392d9ab077f231aca.webp" 
              alt="Uniport Logo" 
              className="h-12 w-auto"
            />
            <span className="text-3xl font-bold text-gray-900">Uniport</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">로그인</h1>
          <p className="text-sm text-gray-500 mt-2">계정에 로그인하여 투자를 시작하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <i className="ri-error-warning-line"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            <div className="pt-2">
              <Link
                to="/signup"
                className="block w-full py-3 border border-teal-500 text-teal-600 font-semibold rounded-xl hover:bg-teal-50 cursor-pointer transition-colors text-center"
              >
                회원가입
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-2">
              테스트 계정
            </p>
            <p className="text-xs text-gray-400 text-center">
              test@test.com / 1234<br />
              demo@demo.com / demo<br />
              investor@test.com / 1234
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 text-center">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-teal-600 font-semibold hover:text-teal-700 cursor-pointer">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
