'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

// Client component that uses useSearchParams
const ResetPasswordContent = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const { validateResetToken, resetPassword, isLoading } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  useEffect(() => {
    // Skip token validation if email or token is missing
    if (!email || (!token && !resetCode)) {
      return;
    }

    const validateToken = async () => {
      try {
        // Use reset code if entered by user, otherwise use token from URL
        const isValid = await validateResetToken(email, token || '', resetCode || undefined);
        
        if (isValid) {
          setIsTokenValid(true);
        } else {
          setErrorMessage('Token inválido ou expirado.');
          setIsTokenValid(false);
        }
      } catch (error: any) {
        console.error('Error validating token:', error);
        setErrorMessage(error.response?.data?.message || 'Erro ao validar o token. Tente novamente.');
        setIsTokenValid(false);
      } finally {
        setTokenValidated(true);
      }
    };

    // Only validate automatically if token is present (not with code)
    if (token && !resetCode && !tokenValidated) {
      validateToken();
    }
  }, [email, token, resetCode, tokenValidated, validateResetToken]);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isValid = await validateResetToken(email || '', '', resetCode);
      
      if (isValid) {
        setIsTokenValid(true);
      } else {
        setErrorMessage('Código de verificação inválido ou expirado.');
        setIsTokenValid(false);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setErrorMessage('Erro ao validar o código. Tente novamente.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    
    if (password.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    
    try {
      await resetPassword(
        email || '', 
        password, 
        passwordConfirmation, 
        token || undefined, 
        resetCode || undefined
      );
      
      setIsResetComplete(true);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setErrorMessage(error.response?.data?.message || 'Erro ao redefinir a senha. Tente novamente.');
    }
  };

  // If email or token is missing, show error and link to forgot password
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Link inválido</h2>
            <p className="mt-2 text-gray-600">
              O link para redefinir sua senha é inválido ou expirou.
            </p>
          </div>
          <div className="mt-4">
            <Link
              href="/login/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Solicitar um novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isResetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center p-6 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
              Senha redefinida com sucesso!
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Sua senha foi alterada com sucesso. Você já pode usar sua nova senha para acessar o sistema.
              </p>
            </div>
            <div className="mt-5">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not yet validated or we need to enter a code
  if (!token && !isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Digite seu código de verificação
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Insira o código que enviamos para o seu email.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleTokenSubmit}>
            <div>
              <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700">
                Código de Verificação
              </label>
              <div className="mt-1">
                <input
                  id="reset-code"
                  name="resetCode"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Digite o código"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !resetCode}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading || !resetCode ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link
              href="/login/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Solicitar novo código
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Main password reset form (after token is validated)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie uma nova senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite e confirme sua nova senha.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-confirmation" className="block text-sm font-medium text-gray-700">
                Confirme a Nova Senha
              </label>
              <div className="mt-1">
                <input
                  id="password-confirmation"
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="********"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !password || !passwordConfirmation}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading || !password || !passwordConfirmation ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Cancelar e voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
};

// Main page component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
} 