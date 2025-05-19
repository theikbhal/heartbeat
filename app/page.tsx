import Link from 'next/link'

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

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 py-16">
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Mind Mapping</h3>
          <p className="text-gray-600">Create interactive mind maps with drag-and-drop functionality and real-time collaboration.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Task Management</h3>
          <p className="text-gray-600">Organize tasks with nested checklists, progress tracking, and priority levels.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Media Integration</h3>
          <p className="text-gray-600">Embed videos, attach images, and link documents to enhance your mind maps.</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold mb-8">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Basic</h3>
            <p className="text-3xl font-bold mb-4">$10<span className="text-lg text-gray-600">/month</span></p>
            <ul className="text-left space-y-2 mb-6">
              <li>✓ Basic mind mapping</li>
              <li>✓ Task management</li>
              <li>✓ Video embedding</li>
            </ul>
            <Link 
              href="/signup?plan=basic" 
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border-2 border-blue-600">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-3xl font-bold mb-4">$25<span className="text-lg text-gray-600">/month</span></p>
            <ul className="text-left space-y-2 mb-6">
              <li>✓ Everything in Basic</li>
              <li>✓ Advanced collaboration</li>
              <li>✓ Priority support</li>
              <li>✓ Mobile access</li>
            </ul>
            <Link 
              href="/signup?plan=pro" 
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Lifetime</h3>
            <p className="text-3xl font-bold mb-4">₹5,000</p>
            <ul className="text-left space-y-2 mb-6">
              <li>✓ Everything in Pro</li>
              <li>✓ Lifetime access</li>
              <li>✓ Future updates</li>
              <li>✓ Premium support</li>
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
