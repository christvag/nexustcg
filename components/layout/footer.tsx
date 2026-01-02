export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div id="footer-logo-section">
            <a href="https://nexusgrading.com/" id="footer-logo-link">
              <img
                src="/api/storage/nexustcg_textandlogo_white.png"
                alt="Nexus TCGrading"
                className="h-12 mb-3"
                id="footer-logo-img"
              />
            </a>
            <p className="text-xs text-gray-500 mb-3">Official Grading Service</p>
            <p className="text-sm text-gray-400">
              Professional trading card grading service for collectors and enthusiasts.
            </p>
          </div>
          
          <div id="footer-services-section">
            <h4 className="text-sm font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/packages" id="footer-auth-link" className="hover:text-gaming-primary transition-colors">Authentication</a></li>
              <li><a href="/packages" id="footer-bulk-link" className="hover:text-gaming-primary transition-colors">Bulk Grading</a></li>
              <li><a href="/packages" id="footer-standard-link" className="hover:text-gaming-primary transition-colors">Standard Grading</a></li>
              <li><a href="/packages" id="footer-premium-link" className="hover:text-gaming-primary transition-colors">Premium Grading</a></li>
            </ul>
          </div>

          <div id="footer-support-section">
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://nexusgrading.com/about/" id="footer-about-link" className="hover:text-gaming-primary transition-colors">About Us</a></li>
              <li><a href="https://nexusgrading.com/contact-us/" id="footer-contact-link" className="hover:text-gaming-primary transition-colors">Contact</a></li>
              <li><a href="https://nexusgrading.com/#faq" id="footer-faq-link" className="hover:text-gaming-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div id="footer-legal-section">
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://nexusgrading.com/privacy-policy" id="footer-privacy-link" className="hover:text-gaming-primary transition-colors">Privacy Policy</a></li>
              <li><a href="https://nexusgrading.com/terms-of-service" id="footer-terms-link" className="hover:text-gaming-primary transition-colors">Terms of Service</a></li>
              <li><a href="https://nexusgrading.com/refund-policy" id="footer-refund-link" className="hover:text-gaming-primary transition-colors">Refund Policy</a></li>
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