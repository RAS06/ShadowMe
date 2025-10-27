import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError("");
    setIsLoading(true);

    try {
      // Send login request
      const response = await axios.post("/login", {
        email: values.email,
        password: values.password,
      });

      // Handle success — expect a JWT
      const { token } = response.data;
      if (token) {
        localStorage.setItem("jwt", token);
        navigate("/dashboard"); // redirect to dashboard
      } else {
        setServerError("Login failed: invalid response from server.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || "Invalid credentials.";
        setServerError(message);
      } else {
        setServerError("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Log into your account</h2>

      {serverError && (
        <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block mb-3">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            {...register("email", { required: "Email is required" })}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.email ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            {...register("password", { required: "Password is required" })}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1 ${
              errors.password ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
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
              Logging in...
            </span>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Don’t have an account? <a href="/signup" className="underline">Sign up</a>
      </p>
    </div>
  );
}
