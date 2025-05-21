export default function ResetPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Reset Password</h2>
        <p className="mb-2 text-gray-700">Password reset is not automated yet.</p>
        <p className="mb-4 text-gray-700">
          Please call <b className="text-black">9901014560</b> to reset your password manually.<br/>(Beta stage)
        </p>
        <a href="/login" className="text-blue-600 underline">Back to Login</a>
      </div>
    </div>
  );
} 