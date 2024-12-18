"use client";

import { useState } from "react";

export default function UploadPage() {
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      setMessage("Please select an image.");
      return;
    }
    
    const formData = new FormData();
    formData.append("image", image);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("이미지가 성공적으로 업로드 되었습니다!");
        console.log(data);
      } else {
        setMessage(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      setMessage("An error occurred during upload.");
      console.error(error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">화재 이미지 업로드</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="file-upload" className="text-lg text-gray-600 mb-2">이미지를 선택해주세요.</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-200"
          >
            이미지 업로드
          </button>
        </form>
        
        {message && (
          <p
            className={`mt-4 text-center text-lg ${
              message.includes("failed") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
