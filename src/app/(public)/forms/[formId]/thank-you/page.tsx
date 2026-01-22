import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="backdrop-blur-sm bg-white/90 rounded-xl border-2 border-slate-200 p-12">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-slate-600 mb-8">
            Your response has been successfully submitted. We appreciate you taking the time to complete this form.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              You can now close this page.
            </p>
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-500">
          Powered by{' '}
          <Link href="/" className="text-blue-600 hover:underline">
            StatQ
          </Link>
        </div>
      </div>
    </div>
  );
}
