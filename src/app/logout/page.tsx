'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message);
          // 2초 후 메인 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setMessage(data.error || '로그아웃 중 오류가 발생했습니다.');
        }
      } catch (error) {
        setMessage('로그아웃 중 오류가 발생했습니다.');
        console.error(error);
      }
    };

    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">로그아웃 중...</h1>
        {message && <p className="text-gray-600">{message}</p>}
      </div>
    </div>
  );
} 