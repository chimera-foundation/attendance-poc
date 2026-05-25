'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../context';
import {
  IconCalendarToday,
  IconError,
  IconMail,
  IconLock,
  IconVisibility,
  IconVisibilityOff,
  IconCheckCircle,
  IconLoader,
  IconArrowForward,
} from '../components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user, router]);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!email.includes('@') && email !== 'EMP-2026-089') {
      setError('Please enter a valid email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        setError('Invalid credentials. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setError('Login failed. Please verify your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center py-6">
      <div className="text-center mb-8">
        <h1 className="font-headline text-[24px] font-semibold text-on-surface tracking-tight mb-1">
          Welcome Back
        </h1>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] border border-slate-100/50">
        <form className="space-y-4" onSubmit={handleSubmit}>

          {error && (
            <div className="p-3 bg-error-container/40 border border-error/10 text-error rounded-xl text-xs flex items-center gap-2">
              <IconError className="w-[18px] h-[18px] shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wider text-secondary ml-1" htmlFor="email">
              Email
            </label>
            <div className="relative group">
              <IconMail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input
                className="w-full h-12 pl-11 pr-4 bg-surface rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-body-md text-on-surface placeholder:text-outline/40"
                id="email"
                placeholder="E.g. name@company.com"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-semibold tracking-wider text-secondary" htmlFor="password">
                PASSWORD
              </label>
              <a className="text-[11px] font-semibold text-primary hover:text-primary-container transition-colors" href="#">
                Forgot Password?
              </a>
            </div>
            <div className="relative group">
              <IconLock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input
                className="w-full h-12 pl-11 pr-12 bg-surface rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-body-md text-on-surface placeholder:text-outline/40"
                id="password"
                placeholder="Enter password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-secondary transition-colors h-10 w-10 flex items-center justify-center outline-none"
                onClick={togglePassword}
                type="button"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <IconVisibilityOff className="w-5 h-5" />
                ) : (
                  <IconVisibility className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              className={`w-full h-12 text-button-text rounded-2xl shadow-[0px_8px_16px_rgba(70,72,212,0.15)] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 outline-none font-semibold ${isSuccess
                ? 'bg-tertiary text-on-tertiary'
                : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                isSuccess ? (
                  <>
                    <IconCheckCircle className="w-5 h-5 animate-scale" />
                    <span>Success</span>
                  </>
                ) : (
                  <IconLoader className="w-5 h-5 animate-spin" />
                )
              ) : (
                <>
                  <span>Login</span>
                  <IconArrowForward className="w-[18px] h-[18px]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center select-none">
        <p className="text-body-md text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            className="text-primary font-semibold hover:underline underline-offset-4 decoration-2 transition-all"
            href="/register"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
