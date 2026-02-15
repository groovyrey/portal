import React from 'react';

const DocsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl font-sans bg-gray-50 text-gray-800">
      <h1 className="text-5xl font-extrabold text-center text-gray-900 mb-12 drop-shadow-sm">
        Application Documentation
      </h1>

      {/* Getting Started */}
      <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-3">
          Getting Started
        </h2>
        <h3 className="text-2xl font-semibold text-gray-700 mb-3">1. Login & Initial Setup</h3>
        <p className="text-lg leading-relaxed mb-4">
          To begin, navigate to the application's homepage. You will be prompted to enter your official
          school student portal User ID and Password. This application will use these credentials to securely
          log into your school's portal on your behalf and retrieve your academic data.
        </p>
        <p className="text-lg leading-relaxed mb-4">
          Your credentials are saved locally in your browser's <code className="bg-gray-200 px-1 py-0.5 rounded">localStorage</code>
          for convenience, allowing for automatic re-login. Please refer to the Disclaimer page for important security information
          regarding credential storage.
        </p>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3 mt-6">2. Dashboard Overview</h3>
        <p className="text-lg leading-relaxed">
          Upon successful login, you will be directed to your personalized dashboard. This page provides a
          summary of your key academic information, including personal details, upcoming schedule, and financial
          summary.
        </p>
      </section>

      {/* Features */}
      <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-3">
          Application Features
        </h2>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3">Grades</h3>
        <p className="text-lg leading-relaxed mb-4">
          View your grades for various semesters. The application fetches your grades directly from the
          student portal and presents them in an easy-to-read format. You can typically navigate through
          different semesters or report periods to see your academic performance.
        </p>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3 mt-6">Schedule</h3>
        <p className="text-lg leading-relaxed mb-4">
          Access your class timetable in a clear weekly format. Subjects are displayed with their respective
          days, times, and rooms. The table format is designed to give you an at-a-glance view of your weekly
          commitments.
        </p>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3 mt-6">Financial Summary</h3>
        <p className="text-lg leading-relaxed mb-4">
          Keep track of your financial obligations to the school. This section provides a summary of your
          account balance, due dates, payments made, and assessment details. It retrieves data from your
          student account ledger on the portal.
        </p>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3 mt-6">Offered Subjects</h3>
        <p className="text-lg leading-relaxed">
          Browse the list of subjects offered by the institution. This can be useful for planning future
          enrollments or reviewing course prerequisites.
        </p>
      </section>

      {/* Troubleshooting */}
      <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-3">
          Troubleshooting
        </h2>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3">Login Issues</h3>
        <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed">
          <li><strong className="font-medium">Incorrect Credentials:</strong> Double-check your User ID and Password. They are case-sensitive.</li>
          <li><strong className="font-medium">Portal Offline/Changes:</strong> The school's portal might be undergoing maintenance or updates. Try accessing the official portal directly.</li>
          <li><strong className="font-medium">Network Problems:</strong> Ensure you have a stable internet connection.</li>
          <li><strong className="font-medium">Clear Cache:</strong> If issues persist, try clearing your browser's cache and cookies, then attempt to log in again.</li>
        </ul>

        <h3 className="text-2xl font-semibold text-gray-700 mb-3 mt-6">Data Not Updating / Incorrect Data</h3>
        <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed">
          <li><strong className="font-medium">Re-login:</strong> Logging out and logging back in will force the application to fetch fresh data from the portal.</li>
          <li><strong className="font-medium">Official Portal Check:</strong> Compare the data in this app with the official student portal to identify discrepancies.</li>
        </ul>
      </section>

      {/* Support & Feedback */}
      <section className="mb-12 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-3">
          Support & Feedback
        </h2>
        <p className="text-lg leading-relaxed">
          If you encounter persistent issues not covered here, or have suggestions for improvements, please
          reach out to the application developer (contact information if available). Remember, this is an
          independent project.
        </p>
      </section>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} [Your Application Name/Organization]. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default DocsPage;
