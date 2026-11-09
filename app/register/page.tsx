'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useRegister } from '@/hooks/use-auth';
import { jwtDecode } from 'jwt-decode';
import { TipoDonante } from '@/lib/type/donante';
import { tipoDonanteApi, donantesApi } from '@/lib/api';
import { TokenPayload } from '@/lib/auth-utils';
import { validateEmail, validateCuitDni } from '@/lib/utils/helpers';
import { useRouter } from 'next/navigation';
import { ErrorResponse } from '@/lib/type/';
import { tieneNumeroDeCalle } from '@/lib/utils/text-limit';
import {
  JURISDICCIONES,
  LARGO_CARGO,
  LARGO_NOMBRE_PERSONA,
  esOrganismoPublico,
  problemaDeNombre,
  unirResponsable,
} from '@/lib/organismo';

const EMPTY_FORM = {
  tipoDonanteId: '',
  nombre: '',
  apellido: '',
  razonSocial: '',
  email: '',
  cuitDni: '',
  direccion: '',
  telefono: '',
  password: '',
  confirmPassword: '',
  jurisdiccion: '',
  respApellido: '',
  respNombre: '',
  cargoResponsable: '',
};

type FormErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>;

function isLegalEntity(tipo: TipoDonante | undefined): boolean {
  if (!tipo) return false;
  const desc = tipo.descripcion.toLowerCase();
  return desc.includes('empresa') || desc.includes('organismo') || desc.includes('público') || desc.includes('publico');
}

export default function RegisterPage() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof EMPTY_FORM, boolean>>>({});
  const [tipoDonantes, setTipoDonantes] = useState<TipoDonante[]>([]);
  const { register, isLoading } = useRegister();
  const router = useRouter();
  useEffect(() => {
    tipoDonanteApi.getAll().then(setTipoDonantes).catch(() => { });
  }, []);

  const selectedTipo = tipoDonantes.find((t) => String(t.id) === formData.tipoDonanteId);
  const usesRazonSocial = isLegalEntity(selectedTipo);
  const esOrganismo = esOrganismoPublico(selectedTipo);
  const tipoSeleccionado = !!formData.tipoDonanteId;

  function validate(data: typeof EMPTY_FORM): FormErrors {
    const e: FormErrors = {};
    const tipo = tipoDonantes.find((t) => String(t.id) === data.tipoDonanteId);
    const legalEntity = isLegalEntity(tipo);
    const organismo = esOrganismoPublico(tipo);

    if (!data.tipoDonanteId) e.tipoDonanteId = 'Seleccioná el tipo de donante';

    if (legalEntity) {
      if (!data.razonSocial.trim()) e.razonSocial = organismo ? 'El nombre del organismo es obligatorio' : 'La razón social es obligatoria';
      else if (data.razonSocial.trim().length < 3) e.razonSocial = 'Mínimo 3 caracteres';
      if (organismo) {
        if (!data.jurisdiccion) e.jurisdiccion = 'Seleccioná la jurisdicción';
        const apellido = problemaDeNombre(data.respApellido, 'el apellido del responsable');
        if (apellido) e.respApellido = apellido;
        const nombre = problemaDeNombre(data.respNombre, 'el nombre del responsable');
        if (nombre) e.respNombre = nombre;
        if (!data.cargoResponsable.trim()) e.cargoResponsable = 'El cargo del responsable es obligatorio';
        if (!data.telefono.trim()) e.telefono = 'El teléfono es obligatorio para un organismo';
      }
    } else if (data.tipoDonanteId) {
      const nombre = problemaDeNombre(data.nombre, 'tu nombre');
      if (nombre) e.nombre = nombre;
      const apellido = problemaDeNombre(data.apellido, 'tu apellido');
      if (apellido) e.apellido = apellido;
    }

    if (!data.email.trim()) e.email = 'El correo es obligatorio';
    else if (!validateEmail(data.email)) e.email = 'Correo inválido';

    if (!data.cuitDni.trim()) e.cuitDni = 'El CUIT/DNI es obligatorio';
    else if (!validateCuitDni(data.cuitDni)) e.cuitDni = 'Debe tener 8 (DNI) u 11 (CUIT) dígitos';
    else if (organismo && data.cuitDni.replace(/\D/g, '').length !== 11) e.cuitDni = 'El CUIT del organismo debe tener 11 dígitos';

    if (!data.direccion.trim()) e.direccion = 'La dirección es obligatoria';
    else if (data.direccion.trim().length < 5) e.direccion = 'Ingresá una dirección válida';
    else if (!tieneNumeroDeCalle(data.direccion)) e.direccion = 'Incluí la altura (número de la casa)';

    if (!data.password) e.password = 'La contraseña es obligatoria';
    else if (data.password.length < 6) e.password = 'Mínimo 6 caracteres';

    if (!data.confirmPassword) e.confirmPassword = 'Confirmá tu contraseña';
    else if (data.password !== data.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';

    return e;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    if (name === 'tipoDonanteId') {
      updated.nombre = '';
      updated.apellido = '';
      updated.razonSocial = '';
      updated.jurisdiccion = '';
      updated.respApellido = '';
      updated.respNombre = '';
      updated.cargoResponsable = '';
    }
    setFormData(updated);
    if (touched[name as keyof typeof EMPTY_FORM]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof typeof EMPTY_FORM;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(formData));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const allTouched = Object.keys(EMPTY_FORM).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<keyof typeof EMPTY_FORM, boolean>,
    );
    setTouched(allTouched);
    const errs = validate(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const nombreEfectivo = usesRazonSocial ? formData.razonSocial.trim() : `${formData.nombre.trim()} ${formData.apellido.trim()}`;

    try {
      const authResult = await register({
        name: nombreEfectivo,
        apellido: formData.apellido,
        email: formData.email,
        cuitDni: formData.cuitDni,
        password: formData.password,
      });
      const usuarioId = authResult?.access_token
        ? jwtDecode<TokenPayload>(authResult.access_token).id
        : undefined;
      await donantesApi.create({
        nombre: nombreEfectivo,
        tipoDonanteId: Number(formData.tipoDonanteId),
        razonSocial: usesRazonSocial ? formData.razonSocial.trim() : undefined,
        direccion: formData.direccion.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        usuarioId,
        ...(esOrganismo
          ? {
              jurisdiccion: formData.jurisdiccion,
              responsable: unirResponsable(formData.respApellido, formData.respNombre),
              cargoResponsable: formData.cargoResponsable.trim(),
            }
          : {}),
      });
      toast.success('Registro exitoso! Por favor, inicia sesión.');
      setFormData(EMPTY_FORM);
      setTouched({});
      setErrors({});
      router.push('/login');
    } catch (error: ErrorResponse | any) {
      toast.error(error.message || 'Error al registrar. Intentá nuevamente.');
    }
  };

  const field = (name: keyof typeof EMPTY_FORM) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    onBlur: handleBlur,
  });

  const err = (name: keyof typeof EMPTY_FORM) =>
    touched[name] && errors[name] ? 'border-red-400 focus-visible:ring-red-400' : '';

  const FieldError = ({ name }: { name: keyof typeof EMPTY_FORM }) =>
    touched[name] && errors[name] ? (
      <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
    ) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Registrando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-red-600 px-6 py-7 text-center">
            <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
            <p className="text-red-200 text-xs mt-1">Únete a nuestra comunidad</p>
          </div>

          <div className="px-6 py-6">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="tipoDonanteId" className="block text-xs font-semibold text-gray-600 mb-1">
                  Tipo de donante
                </label>
                <select
                  id="tipoDonanteId"
                  className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm bg-white transition-colors focus-visible:outline-none focus-visible:ring-1 ${touched.tipoDonanteId && errors.tipoDonanteId
                      ? 'border-red-400 focus-visible:ring-red-400'
                      : 'border-input focus-visible:ring-ring'
                    }`}
                  {...field('tipoDonanteId')}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tipoDonantes.map((t) => (
                    <option key={t.id} value={t.id}>{t.descripcion}</option>
                  ))}
                </select>
                <FieldError name="tipoDonanteId" />
              </div>

              {tipoSeleccionado && usesRazonSocial && (
                <div>
                  <label htmlFor="razonSocial" className="block text-xs font-semibold text-gray-600 mb-1">
                    {esOrganismo ? 'Nombre del organismo' : 'Razón Social'}
                  </label>
                  <Input
                    id="razonSocial"
                    type="text"
                    placeholder={esOrganismo ? 'Ministerio de Ambiente' : 'Empresa S.A.'}
                    className={`h-9 text-sm ${err('razonSocial')}`}
                    {...field('razonSocial')}
                  />
                  <FieldError name="razonSocial" />
                </div>
              )}

              {tipoSeleccionado && esOrganismo && (
                <>
                  <div>
                    <label htmlFor="jurisdiccion" className="block text-xs font-semibold text-gray-600 mb-1">
                      Jurisdicción
                    </label>
                    <select
                      id="jurisdiccion"
                      className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm bg-white transition-colors focus-visible:outline-none focus-visible:ring-1 ${touched.jurisdiccion && errors.jurisdiccion
                          ? 'border-red-400 focus-visible:ring-red-400'
                          : 'border-input focus-visible:ring-ring'
                        }`}
                      {...field('jurisdiccion')}
                    >
                      <option value="">Seleccionar jurisdicción...</option>
                      {JURISDICCIONES.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                    <FieldError name="jurisdiccion" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="respApellido" className="block text-xs font-semibold text-gray-600 mb-1">
                        Apellido del responsable
                      </label>
                      <Input
                        id="respApellido"
                        type="text"
                        placeholder="Gómez"
                        maxLength={LARGO_NOMBRE_PERSONA}
                        className={`h-9 text-sm ${err('respApellido')}`}
                        {...field('respApellido')}
                      />
                      <FieldError name="respApellido" />
                    </div>
                    <div>
                      <label htmlFor="respNombre" className="block text-xs font-semibold text-gray-600 mb-1">
                        Nombre del responsable
                      </label>
                      <Input
                        id="respNombre"
                        type="text"
                        placeholder="Laura"
                        maxLength={LARGO_NOMBRE_PERSONA}
                        className={`h-9 text-sm ${err('respNombre')}`}
                        {...field('respNombre')}
                      />
                      <FieldError name="respNombre" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cargoResponsable" className="block text-xs font-semibold text-gray-600 mb-1">
                      Cargo del responsable
                    </label>
                    <Input
                      id="cargoResponsable"
                      type="text"
                      placeholder="Directora de Compras"
                      maxLength={LARGO_CARGO}
                      className={`h-9 text-sm ${err('cargoResponsable')}`}
                      {...field('cargoResponsable')}
                    />
                    <FieldError name="cargoResponsable" />
                  </div>
                </>
              )}

              {/* 2b. Nombre Completo  particular */}
              {tipoSeleccionado && !usesRazonSocial && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="nombre" className="block text-xs font-semibold text-gray-600 mb-1">
                      Nombre
                    </label>
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Juan"
                      maxLength={LARGO_NOMBRE_PERSONA}
                      className={`h-9 text-sm ${err('nombre')}`}
                      {...field('nombre')}
                    />
                    <FieldError name="nombre" />
                  </div>
                  <div>
                    <label htmlFor="apellido" className="block text-xs font-semibold text-gray-600 mb-1">
                      Apellido
                    </label>
                    <Input
                      id="apellido"
                      type="text"
                      placeholder="Pérez"
                      maxLength={LARGO_NOMBRE_PERSONA}
                      className={`h-9 text-sm ${err('apellido')}`}
                      {...field('apellido')}
                    />
                    <FieldError name="apellido" />
                  </div>
                </div>
              )}

              {tipoSeleccionado && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1">
                      Correo Electrónico
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className={`h-9 text-sm ${err('email')}`}
                      {...field('email')}
                    />
                    <FieldError name="email" />
                  </div>

                  <div>
                    <label htmlFor="cuitDni" className="block text-xs font-semibold text-gray-600 mb-1">
                      {esOrganismo ? 'CUIT' : 'CUIT / DNI'}
                    </label>
                    <Input
                      id="cuitDni"
                      type="text"
                      placeholder="20123456789"
                      className={`h-9 text-sm ${err('cuitDni')}`}
                      {...field('cuitDni')}
                    />
                    <FieldError name="cuitDni" />
                  </div>

                  <div>
                    <label htmlFor="direccion" className="block text-xs font-semibold text-gray-600 mb-1">
                      Dirección
                    </label>
                    <Input
                      id="direccion"
                      type="text"
                      placeholder="Av. Colón 1234, Córdoba"
                      className={`h-9 text-sm ${err('direccion')}`}
                      {...field('direccion')}
                    />
                    <FieldError name="direccion" />
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-xs font-semibold text-gray-600 mb-1">
                      Teléfono {!esOrganismo && <span className="font-normal text-gray-400">(opcional)</span>}
                    </label>
                    <Input
                      id="telefono"
                      type="number"
                      placeholder="+54 11 1234-5678"
                      className={`h-9 text-sm ${err('telefono')}`}
                      {...field('telefono')}
                    />
                    <FieldError name="telefono" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1">
                        Contraseña
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className={`h-9 text-sm ${err('password')}`}
                        {...field('password')}
                      />
                      <FieldError name="password" />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 mb-1">
                        Confirmar
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className={`h-9 text-sm ${err('confirmPassword')}`}
                        {...field('confirmPassword')}
                      />
                      <FieldError name="confirmPassword" />
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-1">
                    <p className="text-xs text-gray-400">
                      Al registrarte aceptás nuestros{' '}
                      <a href="#" className="underline">Términos</a> y{' '}
                      <a href="#" className="underline">Política de Privacidad</a>
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-10 text-sm font-semibold mt-2">
                    Registrarse
                  </Button>
                </>
              )}

            </form>
          </div>

          <div className="px-6 pb-5 text-center space-y-2">
            <p className="text-xs text-gray-500">
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className="text-red-600 font-medium hover:underline">Iniciar sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
