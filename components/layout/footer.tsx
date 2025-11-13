export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gradient mb-4">TCG Grading</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Professional trading card grading service for collectors and enthusiasts.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Authentication</a></li>
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Bulk Grading</a></li>
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Standard Grading</a></li>
              <li><a href="/packages" className="hover:text-gaming-primary transition-colors">Express Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/about" className="hover:text-gaming-primary transition-colors">About Us</a></li>
              <li><a href="/report" className="hover:text-gaming-primary transition-colors">Reports</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-gaming-primary transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 TCG Grading Service. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}