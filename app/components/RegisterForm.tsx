"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await register(name, email, password);
    setLoading(false);
    if (res.success) {
      router.push("/login");
    } else {
      setError(res.error || "Registration failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">Register</h2>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Name"
        required
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full border rounded px-3 py-2"
      />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="text-sm mt-2 text-gray-500">
        Already have an account? <a href="/login" className="text-blue-600 underline">Login</a>
      </div>
    </form>
  );
} 