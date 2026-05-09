'use client';

import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ForgetPasswordPage() {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Por favor ingresa tu correo');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
    }, 1500);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      alert('Por favor ingresa el código');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('reset');
    }, 1500);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Contraseña actualizada correctamente');
      setStep('email');
      setEmail('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 px-8 py-10">
            <h1 className="text-3xl font-bold text-white text-center">
              {step === 'email' && 'Recuperar Contraseña'}
              {step === 'verify' && 'Verificar Código'}
              {step === 'reset' && 'Nueva Contraseña'}
            </h1>
            <p className="text-purple-100 text-center mt-2 text-sm">
              {step === 'email' && 'Ingresa tu correo para recibir un código'}
              {step === 'verify' && 'Revisa tu correo y ingresa el código'}
              {step === 'reset' && 'Crea tu nueva contraseña'}
            </p>
          </div>

          {/* Form Body */}
          <div className="px-8 py-8">
            {/* Step 1: Email */}
            {step === 'email' && (
              <form className="space-y-5" onSubmit={handleEmailSubmit}>
                <div className="space-y-2">
                  <FieldLabel htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Correo Electrónico
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Te enviaremos un código de verificación a este correo
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </form>
            )}

            {/* Step 2: Verify Code */}
            {step === 'verify' && (
              <form className="space-y-5" onSubmit={handleVerifySubmit}>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-700">
                    Hemos enviado un código de 6 dígitos a:
                    <br />
                    <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="code" className="text-sm font-semibold text-gray-700">
                    Código de Verificación
                  </FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  ← Volver
                </button>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 'reset' && (
              <form className="space-y-5" onSubmit={handleResetSubmit}>
                <div className="space-y-2">
                  <FieldLabel htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                    Nueva Contraseña
                  </FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirmar Contraseña
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  ← Comenzar de nuevo
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Recuerdas tu contraseña?</span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              href="/login"
              className="block w-full text-center py-2.5 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition duration-200"
            >
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
