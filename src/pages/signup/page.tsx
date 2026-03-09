import { Link } from "react-router-dom";

/**
 * 접수기간 종료 시 회원가입 비활성화.
 * /signup 직접 접근 시 안내만 표시하고, 로그인은 그대로 사용 가능.
 */
export default function SignupPage() {
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
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
            <i className="ri-time-line text-2xl text-amber-600" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">회원가입 접수 종료</h1>
          <p className="text-gray-600 text-sm mb-6">
            접수 기간이 종료되어 현재 회원가입을 받지 않습니다.
            <br />
            기존 계정으로 로그인해 주세요.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 py-3.5 text-base font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors"
            >
              <i className="ri-login-box-line" aria-hidden />
              로그인
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
