export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div id="footer-logo-section">
            <img
              src="/api/storage/nexustcg_textandlogo_white.png"
              alt="Nexus TCGrading"
              className="h-12 mb-3"
              id="footer-logo-img"
            />
            <p className="text-xs text-gray-500 mb-3">Official Grading Service</p>
            <p className="text-sm text-gray-400">
              Professional trading card grading service for collectors and enthusiasts.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Authentication</a></li>
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Bulk Grading</a></li>
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Standard Grading</a></li>
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Express Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/about" className="hover:text-gaming-primary transition-colors">About Us</a></li>
              <li><a href="/population-report" className="hover:text-gaming-primary transition-colors">Population Report</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-sm text-gray-400">
            © 2024 TCG Grading Service. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}