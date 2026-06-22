import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold"
        >
          AdsExchange
        </Link>

        <div className="flex gap-4">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/payment-history">Payments</Link>
          <Link to="/settings">Settings</Link>
        </div>
      </div>
    </nav>
  );
}
