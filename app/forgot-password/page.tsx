'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';
import { validateEmail } from '@/lib/utils/helpers';

const SEGUNDOS_REENVIO = 60;
const ERROR_RED = 'No pudimos conectar con el servidor. Intentá nuevamente.';

// Los errores del backend traen `message` como texto o como lista (validaciones del DTO)
function mensajeDeError(err: unknown): string {
  const e = err as { message?: string | string[]; statusCode?: number } | undefined;
  if (!e || e.statusCode === undefined) return ERROR_RED;
  const m = Array.isArray(e.message) ? e.message[0] : e.message;
  return m || 'Ocurrió un error. Intentá nuevamente.';
}

function reglasDeContrasena(nueva: string, confirmacion: string) {
  return [
    { ok: nueva.length >= 8, texto: 'Al menos 8 caracteres' },
    { ok: /[A-Z]/.test(nueva), texto: 'Una letra mayúscula' },
    { ok: /[a-z]/.test(nueva), texto: 'Una letra minúscula' },
    { ok: /\d/.test(nueva), texto: 'Un número' },
    { ok: nueva.length > 0 && nueva === confirmacion, texto: 'Las contraseñas coinciden' },
  ];
}

function CampoContrasena({
  id, etiqueta, value, onChange, autoComplete,
}: {
  id: string; etiqueta: string; value: string; onChange: (v: string) => void; autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} className="text-sm font-semibold text-gray-700">{etiqueta}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-800"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [segundos, setSegundos] = useState(0);

  // cuenta regresiva para poder reenviar el código
  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const emailValido = validateEmail(email.trim());
  const reglas = reglasDeContrasena(newPassword, confirmPassword);
  const formularioValido = /^\d{6}$/.test(code) && reglas.every((r) => r.ok);

  async function pedirCodigo(reenvio = false) {
    setError('');
    setCargando(true);
    try {
      const r = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setAviso(r.message);
      setSegundos(SEGUNDOS_REENVIO);
      setPaso('codigo');
      if (reenvio) setCode('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }

  function enviarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValido) {
      setError('Ingresá un email válido.');
      return;
    }
    void pedirCodigo();
  }

  async function restablecer(e: React.FormEvent) {
    e.preventDefault();
    if (!formularioValido) return;
    setError('');
    setCargando(true);
    try {
      await authApi.resetPassword({ email: email.trim().toLowerCase(), code, newPassword, confirmPassword });
      router.push('/login?reset=success');
    } catch (err) {
      setError(mensajeDeError(err));
      setCargando(false);
    }
  }

  function cambiarEmail() {
    setPaso('email');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setAviso('');
    setSegundos(0);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-red-300 px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black text-center">Recuperar contraseña</h1>
            <p className="text-black text-center mt-2 text-sm">
              {paso === 'email'
                ? 'Ingresá tu email para recibir un código'
                : 'Ingresá el código que te enviamos y elegí tu nueva contraseña'}
            </p>
          </div>

          <div className="px-6 sm:px-8 py-8 space-y-5">
            {paso === 'email' && (
              <form className="space-y-5" onSubmit={enviarEmail} noValidate>
                <div className="space-y-2">
                  <FieldLabel htmlFor="email" className="text-sm font-semibold text-gray-700">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email.length > 0 && !emailValido && (
                    <p className="text-xs text-red-600">El formato del email no es válido.</p>
                  )}
                </div>
                <Button type="submit" disabled={cargando || !emailValido} className="w-full">
                  {cargando && <Loader2 className="size-4 animate-spin" />}
                  {cargando ? 'Enviando...' : 'Enviar código'}
                </Button>
              </form>
            )}

            {paso === 'codigo' && (
              <form className="space-y-5" onSubmit={restablecer} noValidate>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status" aria-live="polite">
                  {aviso}
                </div>

                <p className="text-sm text-gray-600">
                  Email: <strong>{email.trim().toLowerCase()}</strong>{' '}
                  <button type="button" onClick={cambiarEmail} className="ml-1 text-red-600 underline underline-offset-2 hover:text-red-700">
                    Cambiar email
                  </button>
                </p>

                <div className="space-y-2">
                  <FieldLabel htmlFor="code" className="text-sm font-semibold text-gray-700">Código de 6 dígitos</FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <CampoContrasena id="newPassword" etiqueta="Nueva contraseña" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
                <CampoContrasena id="confirmPassword" etiqueta="Confirmar contraseña" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

                <ul className="space-y-1 text-sm" aria-label="Requisitos de la contraseña">
                  {reglas.map((r) => (
                    <li key={r.texto} className={`flex items-center gap-2 ${r.ok ? 'text-green-700' : 'text-gray-500'}`}>
                      {r.ok ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
                      <span>{r.texto}</span>
                      <span className="sr-only">{r.ok ? '(cumplido)' : '(pendiente)'}</span>
                    </li>
                  ))}
                </ul>

                <Button type="submit" disabled={cargando || !formularioValido} className="w-full">
                  {cargando && <Loader2 className="size-4 animate-spin" />}
                  {cargando ? 'Actualizando...' : 'Restablecer contraseña'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={cargando || segundos > 0}
                  onClick={() => void pedirCodigo(true)}
                >
                  {segundos > 0 ? `Reenviar código (${segundos} s)` : 'Reenviar código'}
                </Button>
              </form>
            )}

            <div aria-live="assertive" role="alert" className={error ? 'rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700' : 'sr-only'}>
              {error}
            </div>

            <div className="pt-2 text-center">
              <Link href="/login" className="text-sm font-medium text-red-600 underline-offset-4 hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
