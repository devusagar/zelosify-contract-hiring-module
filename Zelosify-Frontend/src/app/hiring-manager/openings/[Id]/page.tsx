"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Profile {
  id: number;
  uploadedBy: string;
  s3Key: string;
  status: string;
  recommended: boolean | null;
  recommendationScore: number | null;
  recommendationReason: string | null;
  submittedAt: string;
}

export default function CandidateReviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, [id]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/hiring-manager/openings/${id}/profiles`);
      if (!res.ok) throw new Error("Failed to fetch profiles");
      
      const json = await res.json();
      setProfiles(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (profileId: number, action: 'shortlist' | 'reject') => {
    setActionLoading(profileId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/hiring-manager/profiles/${profileId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`Failed to ${action} profile`);
      
      // Refresh the list to show updated status
      await fetchProfiles();
    } catch (err) {
      console.error(err);
      alert(`Error: Could not ${action} the profile.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 dark:text-white">Loading candidates...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen dark:text-white">
      <h1 className="text-3xl font-bold mb-6">Candidate Review Dashboard</h1>
      
      {profiles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow text-center text-gray-500">
          No candidates have been submitted for this opening yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {profiles.map(profile => (
            <div key={profile.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                
                {/* Basic Info */}
                <div>
                  <h3 className="text-xl font-semibold mb-1">Candidate Profile #{profile.id}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Uploaded by: <span className="font-medium">{profile.uploadedBy}</span> • {new Date(profile.submittedAt).toLocaleDateString()}
                  </p>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    profile.status === 'SHORTLISTED' ? 'bg-green-100 text-green-800' : 
                    profile.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Status: {profile.status}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-x-3">
                  <button 
                    onClick={() => handleAction(profile.id, 'shortlist')}
                    disabled={actionLoading === profile.id || profile.status !== 'SUBMITTED'}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    Shortlist
                  </button>
                  <button 
                    onClick={() => handleAction(profile.id, 'reject')}
                    disabled={actionLoading === profile.id || profile.status !== 'SUBMITTED'}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* AI Evaluation Data */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  🤖 AI Agent Evaluation
                </h4>
                
                {profile.recommendationScore === null ? (
                  <p className="text-gray-500 animate-pulse">Evaluation in progress...</p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Match Score</p>
                      <p className="text-2xl font-bold">{(profile.recommendationScore * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recommendation</p>
                      <p className={`text-lg font-bold ${profile.recommended ? 'text-green-600' : 'text-orange-500'}`}>
                        {profile.recommended ? 'Highly Recommended' : 'Does Not Meet Criteria'}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reasoning</p>
                      <p className="text-sm mt-1">{profile.recommendationReason}</p>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}