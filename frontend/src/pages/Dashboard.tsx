import { Navigate } from "react-router-dom";

/** Old address — everyone now lives at their own /u/<slug> page. */
export default function Dashboard() {
  return <Navigate to="/" replace />;
}
