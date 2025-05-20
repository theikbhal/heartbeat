import Link from 'next/link'
import { EmailSubscribe } from './components/EmailSubscribe'

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-20">
        <h1 className="text-5xl font-bold text-gray-900">
          Organize Your Thoughts,<br />
          <span className="text-blue-600">Achieve Your Goals</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Heartbeat helps you visualize ideas, manage tasks, and collaborate effectively with an intuitive mind mapping platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/signup" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started Free
          </Link>
          <Link 
            href="/demo" 
            className="border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Watch Demo
          </Link>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Powerful Features Across All Platforms</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-black">Mind Mapping</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Interactive node-based interface</li>
                <li>• Drag-and-drop functionality</li>
                <li>• Real-time collaboration</li>
                <li>• Export/Import capabilities</li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-black">Workflowy View</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Infinite nested lists</li>
                <li>• Expandable/collapsible nodes</li>
                <li>• Keyboard shortcuts</li>
                <li>• Quick search and filter</li>
              </ul>
            </div>
          </div>
          <div className="space-y-8">
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-black">Task Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Nested checklists</li>
                <li>• Progress tracking</li>
                <li>• Due dates and reminders</li>
                <li>• Priority levels</li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-black">Cross-Platform Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Web Application (All Users)</li>
                <li>• Android App (Pro Users)</li>
                <li>• iOS App (Pro Users)</li>
                <li>• Offline Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email Collection Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-center mb-4 text-black">Stay Updated</h2>
          <p className="text-gray-600 mb-8">
            Get early access to new features and updates. We&apos;ll notify you when our mobile apps are ready!
          </p>
          <EmailSubscribe />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold mb-8 text-white">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-black">Basic</h3>
            <p className="text-3xl font-bold mb-4 text-black">$10<span className="text-lg text-gray-600">/month</span></p>
            <ul className="text-left space-y-2 mb-6">
              <li className="text-black">✓ Basic mind mapping</li>
              <li className="text-black">✓ Task management</li>
              <li className="text-black">✓ Video embedding</li>
            </ul>
            <Link 
              href="/signup?plan=basic" 
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border-2 border-blue-600">
            <h3 className="text-xl font-semibold mb-2 text-black">Pro</h3>
            <p className="text-3xl font-bold mb-4 text-black">$25<span className="text-lg text-gray-600">/month</span></p>
            <ul className="text-left space-y-2 mb-6">
              <li className="text-black">✓ Everything in Basic</li>
              <li className="text-black">✓ Advanced collaboration</li>
              <li className="text-black">✓ Priority support</li>
              <li className="text-black">✓ Mobile access</li>
            </ul>
            <Link 
              href="/signup?plan=pro" 
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-black">Lifetime</h3>
            <p className="text-3xl font-bold mb-4 text-black">₹5,000</p>
            <ul className="text-left space-y-2 mb-6">
              <li className="text-black">✓ Everything in Pro</li>
              <li className="text-black">✓ Lifetime access</li>
              <li className="text-black">✓ Future updates</li>
              <li className="text-black">✓ Premium support</li>
            </ul>
            <Link 
              href="/signup?plan=lifetime" 
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
