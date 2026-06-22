import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-10">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid md:grid-cols-3 gap-8">

          <div>
            <h3 className="font-bold text-lg">AdsExchange</h3>
            <p className="text-gray-600 mt-2">
              Connecting advertisers with promoters through simple and effective task-based marketing.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Legal</h3>
            <div className="flex flex-col gap-2">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </div>

        </div>

        <div className="border-t mt-6 pt-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AdsExchange. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
