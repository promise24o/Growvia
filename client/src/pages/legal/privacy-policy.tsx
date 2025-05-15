import { Link } from "wouter";
import { BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Growvia</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8 md:py-12">
        <Button 
          asChild 
          variant="ghost" 
          className="mb-4 p-0 hover:bg-transparent hover:text-primary"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </Button>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-sm mb-4">
              Last updated: May 15, 2025
            </p>

            <h2>Introduction</h2>
            <p>
              Growvia ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our affiliate marketing platform ("Platform").
            </p>
            <p>
              We are a Nigerian company serving the global market, and we comply with applicable data protection laws, including Nigeria's Data Protection Regulation (NDPR) and, where applicable, the General Data Protection Regulation (GDPR).
            </p>

            <h2>Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account Information: When you register, we collect your name, email address, password, and organization details.</li>
              <li>Profile Information: You may provide additional profile information, such as profile pictures and contact details.</li>
              <li>Payment Information: We collect payment details when you subscribe to our paid plans.</li>
              <li>Communications: We collect information when you contact us for customer support or communicate with us.</li>
            </ul>
            <p>We also automatically collect certain information when you use our Platform:</p>
            <ul>
              <li>Log Data: We collect log information when you use our Platform, including your IP address, browser type, access times, and pages viewed.</li>
              <li>Device Information: We collect information about the device you use to access our Platform.</li>
              <li>Usage Information: We collect information about how you use our Platform, including clicks, features used, and time spent.</li>
              <li>Cookies and Similar Technologies: We use cookies and similar technologies to enhance your experience and collect information about how you use our Platform.</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our Platform</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative messages, updates, and security alerts</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues, fraud, or illegal activities</li>
              <li>Personalize your experience and provide content and features that match your profile and interests</li>
            </ul>

            <h2>Information Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>With service providers who perform services on our behalf</li>
              <li>With organizations for which you are a marketer, as necessary for the affiliate marketing functions of our Platform</li>
              <li>To comply with legal obligations or protect rights</li>
              <li>In connection with a business transfer or transaction</li>
              <li>With your consent or at your direction</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2>Data Security</h2>
            <p>
              We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no data transmission or storage system is completely secure, and we cannot guarantee the absolute security of your information.
            </p>

            <h2>Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide you with our services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
            </p>

            <h2>International Data Transfers</h2>
            <p>
              As a Nigerian company serving global users, your information may be transferred to and processed in countries other than your country of residence. We take steps to ensure that your information receives an adequate level of protection wherever it is processed.
            </p>

            <h2>Your Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your personal information</li>
              <li>Restrict or object to certain processing of your information</li>
              <li>Data portability (receiving your data in a structured, commonly used format)</li>
              <li>Withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@growvia.com.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our Platform is not directed to children under 18 years of age. We do not knowingly collect personal information from children under 18. If we learn that we have collected personal information from a child under 18, we will promptly delete that information.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a notice on our Platform prior to the change becoming effective. We encourage you to review this Privacy Policy periodically.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p>
              <strong>Growvia</strong><br />
              Email: privacy@growvia.com<br />
              Address: [Nigerian Physical Address]<br />
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} Growvia. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/legal/terms" className="text-sm text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary-400">
              Terms of Service
            </Link>
            <Link href="/legal/privacy-policy" className="text-sm text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary-400">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}