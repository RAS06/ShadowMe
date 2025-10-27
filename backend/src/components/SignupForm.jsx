import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema for validation
const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignupForm() {
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    setIsLoading(true);

    try {
      // Send POST to /signup - adjust base URL or axios instance as needed
      const payload = {
        name: values.fullName,
        email: values.email,
        password: values.password,
      };

      const response = await axios.post("/signup", payload);

      // Example success handling - adapt to your app's flow
      if (response.status === 201 || response.status === 200) {
        reset();
        alert("Account created successfully — you can now log in.");
      } else {
        setServerError("Unexpected response from server. Please try again.");
      }
    } catch (err) {
      // Axios error handling
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.message;
        setServerError(String(message));
      } else {
        setServerError("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Create an account</h2>

      {serverError && (
        <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block mb-3">
          <span className="text-sm font-medium">Full name</span>
          <input
            type="text"
            {...register("fullName")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.fullName ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="Jane Doe"
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
          )}
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            {...register("email")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.email ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            {...register("password")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.password ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            type="password"
            {...register("confirmPassword")}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.confirmPassword ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="Repeat your password"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
          )}
        </label>

        <button
          type="submit"
          className="w-full py-2 rounded-lg text-white font-medium shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-indigo-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        By creating an account you agree to our <a className="underline">Terms</a>.
      </p>
    </div>
  );
}
