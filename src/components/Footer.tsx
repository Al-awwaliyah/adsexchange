import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t mt-10 py-6">
      <div className="container mx-auto px-4 text-center">
        <h3 className="font-bold text-lg">AdsExchange</h3>

        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          <Link to="/about">About</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          © {new Date().getFullYear()} AdsExchange. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
