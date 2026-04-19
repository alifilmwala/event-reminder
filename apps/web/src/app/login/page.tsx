'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Star, Loader2 } from 'lucide-react';
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
    <main className="min-h-screen flex items-center justify-center bg-surface-muted px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0a2918 0%, #071a0f 70%)' }}
    >
      {/* Decorative top-center gold line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-brand-500/60 bg-surface shadow-lg shadow-brand-900/30">
            <Star size={24} className="text-brand-400" fill="currentColor" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wide text-green-50 uppercase">
              Event Reminder
            </h1>
            <p className="text-brand-500/80 text-xs tracking-[0.2em] uppercase mt-1">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-brand-600 text-xs tracking-widest uppercase">Sign In</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-surface-border rounded-lg p-6 flex flex-col gap-4 shadow-xl"
          noValidate
        >
          <Input
            label="Email Address"
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
            {loading ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-xs text-forest-700 mt-8 tracking-widest uppercase">
          EventReminder &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}

