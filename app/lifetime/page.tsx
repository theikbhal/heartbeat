import Link from 'next/link';

export default function LifetimeDealPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 text-yellow-600">Lifetime Deal</h2>
        <p className="mb-4 text-lg text-gray-700">
          Get <b>lifetime access</b> (minimum 1 year, may be extended up to 2 years or more based on growth and usage) to Heartbeat for a one-time payment of <span className="text-green-700 font-bold">$60 USD</span>.<br/>
          Support our development and enjoy all premium features!
        </p>
        <a
          href="https://www.paypal.com/ncp/links/MCE7DCKLUWRPS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg shadow transition text-lg border border-yellow-600 mb-4"
        >
          Pay $60 via PayPal
        </a>
        <div className="text-sm text-gray-500 mb-2">
          After payment, please email your payment receipt to <b>theikbhal@gmail.com</b> for activation.<br/>
          For any queries, contact us at the same email.
        </div>
        <Link href="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    </div>
  );
} 