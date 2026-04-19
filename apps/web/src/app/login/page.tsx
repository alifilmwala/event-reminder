'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!form.email.includes('@')) e.email = 'Enter a valid email.';
    if (form.password.length < 8)  e.password = 'Password must be at least 8 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await signIn('credentials', {
      email:    form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error('Invalid email or password.');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/30">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">EventReminder</h1>
          <p className="text-slate-400 text-sm">Sign in to your admin panel</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Email address"
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            autoComplete="current-password"
            required
          />

          <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-8">
          EventReminder Admin v1.0
        </p>
      </div>
    </main>
  );
}
