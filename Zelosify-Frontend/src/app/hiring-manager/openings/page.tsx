"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ManagerOpening {
  id: string;
  title: string;
  location: string;
  contractType: string;
  postedDate: string;
}

export default function HiringManagerDashboard() {
  const [openings, setOpenings] = useState<ManagerOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManagerOpenings = async () => {
      try {
        // Note: In a real app, ensure you pass the JWT token in headers here
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/hiring-manager/openings`);
        if (!res.ok) throw new Error("Failed to fetch assigned openings");
        
        const json = await res.json();
        setOpenings(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchManagerOpenings();
  }, []);

  if (loading) return <div className="p-8 text-center dark:text-white">Loading your dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">My Assigned Openings</h1>
      
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4 font-medium">Job Title</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Posted Date</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
            {openings.map((opening) => (
              <tr key={opening.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 font-semibold">{opening.title}</td>
                <td className="px-6 py-4">{opening.location || "N/A"}</td>
                <td className="px-6 py-4">{opening.contractType || "N/A"}</td>
                <td className="px-6 py-4">{new Date(opening.postedDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/hiring-manager/openings/${opening.id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Review Candidates
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {openings.length === 0 && (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            You have no assigned openings at this time.
          </div>
        )}
      </div>
    </div>
  );
}