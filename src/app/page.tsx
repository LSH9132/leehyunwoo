'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Location {
  latitude: number;
  longitude: number;
}

export default function HomePage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const response = await fetch('/api/auth/check-login', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(data.loggedIn);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const updateLocation = async (position: GeolocationPosition) => {
    const newLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };

    try {
      const response = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocation),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '위치 업데이트 실패');
      }

      setLocation(newLocation);
    } catch (err) {
      const message = err instanceof Error ? err.message : '위치 정보를 업데이트하는 중 오류가 발생했습니다.';
      setError(message);
      console.error('Location update error:', err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 정보를 사용할 수 없습니다.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => {
        console.error('Geolocation error:', err);
        switch(err.code) {
          case err.PERMISSION_DENIED:
            setError('위치 정보 접근이 거부되었습니다. 브라우저의 위치 권한을 허용해주세요.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('위치 정보를 사용할 수 없습니다. GPS가 켜져있는지 확인해주세요.');
            break;
          case err.TIMEOUT:
            setError('위치 정보 요청 시간이 초과되었습니다.');
            break;
          default:
            setError(`위치 정보 오류: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(updateLocation);
    }, 20000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  if (error && isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center space-y-4">
          <div className="text-red-500 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">위치 정보 오류</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">로그인이 필요합니다</h2>
          <p className="text-gray-600">위치 정보를 사용하려면 로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  if (!location && isLoggedIn) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">위치 정보를 가져오는 중...</p>
        </div>
      </div>
    );
  }

  const mapUrl = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`;

  return (
    <div className="h-screen w-full p-4 space-y-4">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm space-y-2 text-black">
          <p>현재 위치:</p>
          <p>위도: {location.latitude.toFixed(6)}</p>
          <p>경도: {location.longitude.toFixed(6)}</p>
        </div>
      </div>
      <iframe
        className="w-full h-[calc(100vh-8rem)] rounded-lg shadow-lg"
        style={{ border: 0 }}
        src={mapUrl}
      />
    </div>
  );
}
