'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const { requestPasswordReset, isLoading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await requestPasswordReset(email);
      setEmailSent(true);
    } catch (error) {
      console.error('Error:', error);
      // Mesmo em caso de erro, não revelamos se o email existe ou não
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperação de Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite seu e-mail e enviaremos as instruções para redefinir sua senha.
          </p>
        </div>

        {!emailSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Endereço de Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Endereço de email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Enviando...' : 'Enviar instruções'}
              </button>
            </div>
          </form>
        ) : (
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
              Verifique seu email
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Se o endereço de e-mail informado estiver cadastrado em nosso sistema, 
                você receberá em instantes um e-mail com as instruções para redefinir sua senha.
              </p>
            </div>
            <div className="mt-5">
              <Link 
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 