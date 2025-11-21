'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Package,
  MessageSquare,
  Settings,
  Heart,
  ShoppingCart,
  MapPin,
  Bell,
  Menu,
  X,
  LogOut,
  HelpCircle
} from 'lucide-react';

const sidebarItems = [
  { href: '/user/dashboard', label: 'Dashboard', icon: User },
  { href: '/user/dashboard/orders', label: 'My Orders', icon: Package },
  { href: '/user/dashboard/support', label: 'Support Tickets', icon: MessageSquare },
  { href: '/user/dashboard/profile', label: 'Profile Settings', icon: Settings },
  { href: '/user/dashboard/community', label: 'Community', icon: Heart },
  { href: '/user/dashboard/wishlist', label: 'Wishlist', icon: ShoppingCart },
  { href: '/user/dashboard/addresses', label: 'Addresses', icon: MapPin },
];

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(currentUser);
      setUser({
        id: userData.id,
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        role: userData.role,
        ...userData
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">
            Please log in to access your user dashboard.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Login / Create Account
            </Link>
            <Link
              href="/packages"
              className="block w-full text-blue-400 border border-blue-400 py-3 px-4 rounded-lg hover:bg-blue-900/20 transition-colors font-medium"
            >
              Browse Packages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div id="user-sidebar-header" className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <img
              src="/storage/nexustcg_logo.png"
              alt="Nexus TCG Logo"
              className="h-8 w-8 object-contain"
            />
            <img
              src="/storage/nexustcg_text_logo_white.png"
              alt="Nexus TCGrading"
              className="h-6 object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              JD
            </div>
            <div>
              <div className="font-medium text-white">{user.name}</div>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-900/20 text-blue-400 font-medium'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 pt-4 border-t border-gray-700">
            <Link
              href="/help"
              className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Help & Support</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-300"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 px-4">
              <h1 className="text-xl font-semibold text-white">
                {sidebarItems.find(item => item.href === pathname)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative text-gray-400 hover:text-gray-300">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  2
                </span>
              </button>
              
              <Link href="/shop" className="text-blue-400 hover:text-blue-300 font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}