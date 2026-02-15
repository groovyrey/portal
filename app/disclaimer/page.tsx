import React from 'react';
import Link from 'next/link';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Disclaimer & User Agreement
          </h1>
          <p className="text-lg text-gray-600">Last Updated: October 26, 2023</p>
        </header>

        {/* Third-Party Notice */}
        <section className="mb-12 p-8 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-yellow-800 mb-4">
            <span className="inline-block mr-3 align-middle">⚠️</span>
            Important: Third-Party Application Notice
          </h2>
          <p className="text-lg leading-relaxed text-yellow-900">
            This application is an <strong className="font-semibold">unofficial, third-party tool</strong> developed independently to provide an alternative interface to the student portal at <code className="bg-yellow-200 text-sm px-1 py-0.5 rounded">premium.schoolista.com</code>. It is <strong className="font-semibold text-red-600">NOT</strong> affiliated with, endorsed, sponsored, or managed by the school or Schoolista.
          </p>
        </section>

        {/* Data Handling and Security */}
        <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-indigo-700 mb-6 pb-3 border-b-2 border-indigo-200">
            Data Handling, Security, and User Consent
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            By using this application, you understand, acknowledge, and consent to the following:
          </p>
          <ul className="list-disc list-inside space-y-4 text-lg">
            <li>
              <strong className="font-semibold">Credential Use:</strong> You are required to provide your student portal User ID and Password. These credentials are submitted directly to the school's official portal to establish a session and retrieve your data.
            </li>
            <li className="text-red-700 bg-red-50 p-3 rounded-md">
              <strong className="font-semibold">Local Storage of Credentials:</strong> For your convenience, your User ID and Password are saved in your browser's <code className="bg-red-100 text-sm px-1 py-0.5 rounded">localStorage</code>. This allows for automatic re-login but poses a <strong className="font-semibold">significant security risk</strong> if your computer is shared or compromised. We strongly advise against using this application on public or untrusted computers. You are responsible for clearing your browser data to remove these credentials.
            </li>
            <li>
              <strong className="font-semibold">Data Collection & Caching:</strong> To provide its features, this application scrapes and processes a wide range of your personal information from the portal, including:
              <ul className="list-inside list-[circle] mt-2 ml-6 text-base text-gray-700">
                <li>Personal & Contact Information</li>
                <li>Academic Data (Grades, Schedule, Prospectus)</li>
                <li>Financial Information (Account Balances, Payments, Dues)</li>
              </ul>
            </li>
             <li>
              <strong className="font-semibold">Server-Side Caching:</strong> To improve performance and reliability, scraped data is temporarily cached on our secure, remote database (<a href="https://neon.tech/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">NeonDB</a>). This data is periodically updated when you log in and is used solely to display information back to you. We do not use this data for any other purpose.
            </li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-indigo-700 mb-6 pb-3 border-b-2 border-indigo-200">
            Limitation of Liability & No Warranty
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            This application is provided "as-is" and "as-available," without any warranties, express or implied. We do not guarantee its accuracy, reliability, availability, or that it will be error-free.
          </p>
          <p className="text-lg leading-relaxed">
            By using this application, you agree that the developers and maintainers are not liable for any damages—including but not limited to data breaches, inaccuracies in data, financial loss, or academic issues—that may arise from your use of this tool. You assume all risks associated with providing your credentials and using a third-party interface.
          </p>
        </section>

        {/* Philippine Laws Section */}
        <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-indigo-700 mb-6 pb-3 border-b-2 border-indigo-200">
            Governing Law & Your Rights
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            While this is an unofficial tool, we strive to operate in accordance with the laws of the Republic of the Philippines. As a user and data subject, you have rights under the <strong className="font-semibold">Data Privacy Act of 2012 (RA 10173)</strong>, including the right to be informed, to access, to object, and to rectify your data.
          </p>
          <p className="text-lg leading-relaxed">
            For official information regarding your data and rights, please refer directly to the official student portal, your school's administration, and the website of the <a href="https://www.privacy.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">National Privacy Commission</a>.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center mt-16">
          <p className="text-md text-gray-600">
            By proceeding to use this application, you confirm that you have read, understood, and agreed to the terms outlined in this disclaimer.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            &copy; {new Date().getFullYear()} [Your Application Name/Organization]. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DisclaimerPage;
