'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../context';
import {
  IconAppRegistration,
  IconError,
  IconBadge,
  IconMail,
  IconLock,
  IconCheckCircle,
  IconLoader,
  IconArrowForward,
} from '../components/Icons';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your Full Name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await register(name, email, password);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        setError('Registration failed. Email may already be registered.');
        setIsSubmitting(false);
      }
    } catch {
      setError('An error occurred during registration.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center py-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)] mb-3 border border-outline/5 select-none">
          <IconAppRegistration className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-headline text-[22px] font-semibold text-on-surface tracking-tight mb-1">
          Create Account
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
            <label className="text-[11px] font-semibold tracking-wider text-secondary ml-1" htmlFor="full-name">
              FULL NAME
            </label>
            <div className="relative group">
              <IconBadge className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input
                className="w-full h-11 pl-11 pr-4 bg-surface rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-body-md text-on-surface placeholder:text-outline/40"
                id="full-name"
                placeholder="E.g. Justin Tan"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>


          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wider text-secondary ml-1" htmlFor="email">
              WORK EMAIL
            </label>
            <div className="relative group">
              <IconMail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input
                className="w-full h-11 pl-11 pr-4 bg-surface rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-body-md text-on-surface placeholder:text-outline/40"
                id="email"
                placeholder="E.g. name@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold tracking-wider text-secondary ml-1" htmlFor="password">
              PASSWORD
            </label>
            <div className="relative group">
              <IconLock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input
                className="w-full h-11 pl-11 pr-4 bg-surface rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-body-md text-on-surface placeholder:text-outline/40"
                id="password"
                placeholder="At least 6 characters"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              className={`w-full h-11 text-button-text rounded-2xl shadow-[0px_8px_16px_rgba(70,72,212,0.15)] active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 outline-none font-semibold ${isSuccess
                ? 'bg-tertiary text-on-tertiary'
                : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                isSuccess ? (
                  <>
                    <IconCheckCircle className="w-[18px] h-[18px]" />
                    <span>Success</span>
                  </>
                ) : (
                  <IconLoader className="w-[18px] h-[18px] animate-spin" />
                )
              ) : (
                <>
                  <span>Create Account</span>
                  <IconArrowForward className="w-[18px] h-[18px]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center select-none">
        <p className="text-body-md text-secondary">
          Already have an account?{' '}
          <Link
            className="text-primary font-semibold hover:underline underline-offset-4 decoration-2 transition-all"
            href="/login"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
