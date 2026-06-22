import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t mt-10 bg-muted/30">
      <div className="container mx-auto px-4 py-8">

        <div className="grid md:grid-cols-3 gap-8">

          <div>
            <h3 className="font-bold text-lg">AdsExchange</h3>
            <p className="text-sm mt-2">
              Connecting advertisers with promoters for effective social media marketing campaigns.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Quick Links</h3>

            <div className="flex flex-col gap-2">
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Support</h3>

            <p>Email: support@adsexchange.com</p>

            <a
              href="https://wa.me/2347016799143"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Support
            </a>
          </div>

        </div>

        <div className="border-t mt-6 pt-4 text-center text-sm">
          © {year} AdsExchange. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
