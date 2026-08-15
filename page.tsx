"use client";

import { LoaderMini } from "@/components/common/loader-mini";
import { ApiError } from "@/lib/api";
import { appRoutes } from "@/routes/app-routes";
import { registerUser } from "@/services/auth.service";
import Link from "next/link";
import { useState } from "react";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: RegisterFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  function updateField<Key extends keyof RegisterFormState>(
    key: Key,
    value: RegisterFormState[Key],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {

      return;
    }

    if (form.password !== form.confirmPassword) {
    
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setForm(initialFormState);

   
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to register right now. Please try again.";

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-brand-light-gray/30 bg-white  md:grid-cols-5">
        <div className="hidden bg-brand-navy p-8 md:col-span-2 md:block">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-gold">
            Quick Signup
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white">
            Join AFG Real Estate
          </h2>
          <p className="mt-4 text-sm leading-6 text-brand-light-gray">
            Create your user account to access properties and your personal
            dashboard.
          </p>
        </div>

        <div className="p-6 md:col-span-3 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">
            Create Account
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-black">
            Register
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This form is integrated with your Week 1 API contract.
          </p>

          <form onSubmit={onSubmit} className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Name
              </label>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900  outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900  outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900  outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                placeholder="********"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900  outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                placeholder="********"
                autoComplete="new-password"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoaderMini size={16} color="currentColor" />
                    <span>Submitting</span>
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href={appRoutes.login}
              className="font-semibold text-brand-navy hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
