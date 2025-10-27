// frontend/src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">My Dashboard</h1>
        <div className="space-x-4">
          <Link to="/goals" className="hover:underline">Goals</Link>
          <Link to="/challenges" className="hover:underline">Challenges</Link>
          <Link to="/logout" className="hover:underline">Logout</Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-2">Your Goals</h2>
          <p className="text-gray-600">Goals will appear here...</p>
        </section>

        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-bold mb-2">Your Challenges</h2>
          <p className="text-gray-600">Challenges will appear here...</p>
        </section>
      </main>
    </div>
  );
}
