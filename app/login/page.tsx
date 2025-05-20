import { AuthProvider } from '../components/AuthProvider';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm />
      </div>
    </AuthProvider>
  );
} 