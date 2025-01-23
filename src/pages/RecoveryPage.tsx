import { useNavigate } from "react-router-dom";

export default function RecoveryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Password Recovery</h1>
        <p className="mb-4">Password recovery is not available in this demo.</p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
