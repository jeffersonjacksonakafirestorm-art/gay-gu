export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: April 2025</p>
        <div className="prose text-gray-700 space-y-6">
          <p>Groundwork (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
          <h2 className="text-xl font-bold text-gray-900">Information We Collect</h2>
          <p>We collect information you provide directly to us, including business name, email address, and customer data you enter into the platform. We also collect usage data to improve the service.</p>
          <h2 className="text-xl font-bold text-gray-900">How We Use Your Information</h2>
          <p>We use your information to provide the Groundwork service, send automated emails on your behalf, and improve our product. We never sell your data to third parties.</p>
          <h2 className="text-xl font-bold text-gray-900">Data Security</h2>
          <p>We use industry-standard encryption and security practices. Your data is stored securely using Supabase with row-level security.</p>
          <h2 className="text-xl font-bold text-gray-900">Customer Email Compliance</h2>
          <p>All automated emails sent through Groundwork include unsubscribe links in compliance with CAN-SPAM regulations. You are responsible for having consent to email your customers.</p>
          <h2 className="text-xl font-bold text-gray-900">Contact</h2>
          <p>Questions about this policy? Email us at privacy@groundwork.app</p>
        </div>
      </div>
    </div>
  )
}
