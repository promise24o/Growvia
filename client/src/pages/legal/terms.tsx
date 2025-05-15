import { Link } from "wouter";
import { BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-sm mb-4">
              Last updated: May 15, 2025
            </p>

            <h2>Introduction</h2>
            <p>
              Welcome to Growvia. These Terms of Service ("Terms") govern your access to and use of our affiliate marketing platform, including our website, services, and applications (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms.
            </p>
            <p>
              Growvia is a Nigerian company serving the global market. Our Platform provides tools and services for organizations to manage affiliate marketing programs and for marketers to participate in these programs.
            </p>

            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to all the terms and conditions of this agreement, you may not access or use our Platform.
            </p>

            <h2>User Accounts</h2>
            <p>
              To use certain features of our Platform, you must register for an account. When registering for an account, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account, and you must keep your account password secure.
            </p>
            <p>
              You must notify Growvia immediately of any breach of security or unauthorized use of your account. Growvia will not be liable for any losses caused by any unauthorized use of your account.
            </p>

            <h2>Organization Accounts</h2>
            <p>
              Organizations using our Platform to manage affiliate marketing programs must ensure they have the legal right to offer such programs and comply with all applicable laws and regulations. Organizations are responsible for the content they publish, the products or services they promote, and the terms of their affiliate programs.
            </p>

            <h2>Marketer Accounts</h2>
            <p>
              Marketers using our Platform must ensure they comply with all applicable laws and regulations related to marketing and advertising. Marketers are responsible for honestly representing the organizations, products, and services they promote.
            </p>

            <h2>Subscription Plans and Payment</h2>
            <p>
              Growvia offers various subscription plans. By selecting a subscription plan, you agree to pay the subscription fees indicated for that plan. Subscription fees are billed in advance and are non-refundable. Subscription plans automatically renew until canceled.
            </p>
            <p>
              If you fail to pay any fees or charges due, Growvia may suspend or terminate your access to the Platform. You are responsible for all applicable taxes, and Growvia will charge tax when required to do so.
            </p>

            <h2>Free Trial</h2>
            <p>
              Growvia may offer a free trial of our Platform. At the end of the free trial, your account will automatically be charged for the applicable subscription plan unless you cancel before the end of the trial period.
            </p>

            <h2>Platform Content and Licenses</h2>
            <p>
              Our Platform may contain content provided by Growvia, users, or third parties. All content on our Platform is protected by intellectual property rights, and you may not use, reproduce, distribute, or create derivative works without proper authorization.
            </p>
            <p>
              Growvia grants you a limited, non-exclusive, non-transferable license to access and use our Platform solely for your personal or internal business purposes, in accordance with these Terms.
            </p>

            <h2>User Content</h2>
            <p>
              You retain ownership of any content you submit or upload to our Platform ("User Content"). By submitting User Content, you grant Growvia a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in connection with the operation of our Platform.
            </p>
            <p>
              You represent and warrant that you have all rights necessary to submit User Content to our Platform and that the User Content does not violate any intellectual property rights, privacy rights, or other rights of third parties.
            </p>

            <h2>Prohibited Conduct</h2>
            <p>
              You may not engage in any of the following prohibited activities:
            </p>
            <ul>
              <li>Violating any applicable laws or regulations</li>
              <li>Impersonating another person or entity</li>
              <li>Submitting false or misleading information</li>
              <li>Engaging in fraudulent, deceptive, or misleading practices</li>
              <li>Interfering with the operation of our Platform</li>
              <li>Attempting to gain unauthorized access to our Platform or user accounts</li>
              <li>Using our Platform for any illegal or unauthorized purpose</li>
              <li>Engaging in activities that promote discrimination, harm, or illegal activities</li>
              <li>Uploading viruses, malware, or other malicious code</li>
              <li>Collecting or harvesting data from our Platform without permission</li>
            </ul>

            <h2>Termination</h2>
            <p>
              Growvia may terminate or suspend your access to our Platform at any time, without prior notice or liability, for any reason, including if you breach these Terms. You may terminate your account at any time by contacting us or using the account termination feature on our Platform.
            </p>
            <p>
              Upon termination, your right to use our Platform will immediately cease, and you must cease all use of our Platform and delete any content obtained from our Platform. All provisions of these Terms which by their nature should survive termination shall survive termination.
            </p>

            <h2>Disclaimer of Warranties</h2>
            <p>
              Our Platform is provided "as is" and "as available" without any warranties of any kind, express or implied. Growvia does not warrant that our Platform will be uninterrupted, timely, secure, or error-free. You use our Platform at your own risk.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Growvia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use our Platform.
            </p>

            <h2>Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Growvia and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your access to and use of our Platform, your violation of these Terms, or your violation of any rights of a third party.
            </p>

            <h2>Changes to These Terms</h2>
            <p>
              Growvia may modify these Terms at any time. If we make material changes to these Terms, we will notify you by email or by posting a notice on our Platform prior to the changes becoming effective. Your continued use of our Platform after any changes to these Terms constitutes your acceptance of the revised Terms.
            </p>

            <h2>Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions. Any dispute arising from or relating to these Terms or your use of our Platform shall be subject to the exclusive jurisdiction of the courts in Nigeria.
            </p>

            <h2>Severability</h2>
            <p>
              If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced to the fullest extent under law.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              <strong>Growvia</strong><br />
              Email: legal@growvia.com<br />
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