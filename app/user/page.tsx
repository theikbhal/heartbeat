"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function UserPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
        <p className="mb-2">Email: {user.email}</p>
        <button
          onClick={logout}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
} 