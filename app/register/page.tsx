'use client';

import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    console.log('Registering user:', formData);
    // Add registration logic here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 px-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-600 px-8 py-10">
            <h1 className="text-3xl font-bold text-white text-center">Crear Cuenta</h1>
            <p className="text-blue-100 text-center mt-2 text-sm">Únete a nuestra comunidad hoy</p>
          </div>

          {/* Form Body */}
          <div className="px-8 py-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="space-y-2">
                <FieldLabel htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Nombre Completo
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <FieldLabel htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Correo Electrónico
                </FieldLabel>
                <Input        
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <FieldLabel htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Contraseña
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <FieldLabel htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirmar Contraseña
                </FieldLabel>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full mt-6  text-white font-semibold py-2.5 rounded-lg transition duration-200 transform hover:scale-105"
              >
                Registrarse
              </Button>
            </form>
          </div>

          <div className="border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center py-4">¿Ya tienes una cuenta? <a href="/login" className="text-blue-600 hover:underline">Iniciar sesión</a></p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Al registrarte, aceptas nuestros <a href="#" className="text-blue-600 hover:underline">Términos de Servicio</a> y <a href="#" className="text-blue-600 hover:underline">Política de Privacidad</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}