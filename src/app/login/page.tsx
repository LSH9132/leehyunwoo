'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ValidationError {
  email?: string;
  password?: string;
  submit?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationError>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  // 버튼 활성화 상태를 확인하는 함수
  const isFormValid = () => {
    return email.trim() !== '' && 
           password.trim() !== '' && 
           validateEmail(email);
  };

  // 이메일 입력 핸들러
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // 이메일 실시간 유효성 검사
    if (newEmail && !validateEmail(newEmail)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  // 비밀번호 입력 핸들러
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setErrors(prev => ({ ...prev, password: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ValidationError = {};

    // 폼 제출 시 유효성 검사
    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 에러 타입에 따른 처리
        switch (data.error) {
          case 'auth/user-not-found':
            setErrors({ email: data.message });
            break;
          case 'auth/wrong-password':
            setErrors({ password: data.message });
            break;
          case 'auth/server-error':
            setErrors({ submit: data.message });
            break;
          default:
            setErrors({ submit: '로그인 중 오류가 발생했습니다.' });
        }
        return;
      }

      router.push('/');
    } catch (err) {
      setErrors({ 
        submit: '서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">로그인</h1>
        
        {/* 서버 에러 메시지 */}
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.submit}
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="이메일을 입력하세요"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none
                text-gray-900 placeholder-gray-400
                ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="absolute text-xs text-red-500 mt-1">
                {errors.email}
              </p>
            )}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="비밀번호를 입력하세요"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none
                text-gray-900 placeholder-gray-400
                ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="absolute text-xs text-red-500 mt-1">
                {errors.password}
              </p>
            )}
          </div>
          <button
            type="submit"
            className={`w-full py-3 text-white rounded-lg font-semibold
              transition-all duration-200
              ${isFormValid()
                ? 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none'
                : 'bg-gray-300 cursor-not-allowed'}
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          계정이 없으신가요?{' '}
          <a href="/signup" className="text-blue-500 hover:underline">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}
  