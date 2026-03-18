export const SCHOOL_INFO = {
  name: "La Concepcion College",
  acronym: "LCC",
  location: "San Jose del Monte, Bulacan",
  tagline: "Changing Lives for the Better YOU",
  vision: "La Concepcion College envisions itself to be one of the forefront educational institutions that serves as a catalyst of change for the holistic development of the community, the country, and the ASEAN region.",
  mission: "Inspired by the motherly care and ideals of Mary Immaculate Conception and guided by the core values that befit a true LCCian, LCC dedicates herself to the pursuit of her purpose of inspiring her students and stakeholders to be in their fullest potential by cultivating minds, capturing hearts, and changing lives to become better individuals of society.",
  history: "Established in 1998 by Mr. Francisco C. Magpantay and Dr. Loreto F. Magpantay. It started in 1997 as the 'Little Angels’ Daycare Center' and has grown into a multi-campus institution (Kaypian, Francisco Homes, and Muzon) recognized by CHED and TESDA.",
  coreValues: [
    "Leadership",
    "Competitiveness",
    "Culture of Excellence"
  ],
  campuses: [
    {
      name: "Kaypian Campus (Main)",
      address: "Kaypian Road corner Quirino Highway, City of San Jose del Monte, Bulacan",
      phone: "(044) 762-36-60",
      mobile: "0961-532-3351",
      email: "registrar@laconcepcioncollege.com"
    },
    {
      name: "Francisco Homes Campus",
      address: "Phase-F, Francisco Homes I, Brgy. Narra, CSJDM, Bulacan",
      mobile: "0921-916-7021"
    },
    {
      name: "Muzon Campus",
      address: "Tungko-Santa Maria Road, Zone 2, Brgy. Muzon, CSJDM, Bulacan",
      mobile: "0921-916-7004"
    }
  ],
  socials: {
    facebook: "https://www.facebook.com/laconcepcioncollege",
    website: "https://laconcepcioncollege.com"
  }
};

export const ACADEMIC_PROGRAMS = {
  college: [
    "BS Accountancy",
    "BS Accounting Information System",
    "BS Business Administration (Majors: Financial, Human Resource, Marketing Management)",
    "BS Civil Engineering",
    "BS Computer Science",
    "BS Information Systems",
    "BS Psychology",
    "BS Criminology",
    "AB English Language",
    "BS Hospitality Management",
    "Bachelor of Elementary Education",
    "Bachelor of Secondary Education (Majors: English, Filipino, Math, Science, Social Studies, Values Education)",
    "Bachelor of Physical Education"
  ],
  tesda: [
    "Bookkeeping NC III",
    "Driving NC II",
    "Events Management Services NC III",
    "Food & Beverage Services NC II",
    "Shielded Metal Arc Welding (SMAW) NC II"
  ],
  basic_ed: [
    "Preschool",
    "Elementary",
    "Junior High School",
    "Senior High School (Academic and TVL Tracks)"
  ]
};

export const BUILDING_CODES = {
  "FCM": "Francisco C. Magpantay (Main Building)",
  "FCM2": "Francisco C. Magpantay Annex",
  "SOL": "School of Law / Social Sciences Building",
  "HM": "Hospitality Management Building",
  "CADLAB": "Computer Aided Design Laboratory (Main Bldg)",
  "CL": "Computer Laboratory"
};

export const GRADING_SYSTEM = `
- 1.00 (99-100): Excellent
- 1.25 (96-98): Superior
- 1.50 (93-95): Very Good
- 1.75 (90-92): Good
- 2.00 (87-89): Satisfactory
- 2.25 (84-86): Fairly Satisfactory
- 2.50 (81-83): Fair
- 2.75 (78-80): Passed
- 3.00 (75-77): Passed (Lowest Passing Grade)
- 5.00 (Below 75): Failed
- INC: Incomplete (Must be completed within one year)
- OD: Officially Dropped
- UD: Unofficially Dropped
`;

export const COMMON_PROCEDURES = `
1. **Adding/Dropping Subjects**:
   - Must be done within the first 2 weeks of classes.
   - Requires filling out the 'Adding/Dropping Form' at the Registrar's Office.
   - Dean's approval is required.

2. **Examination Permit**:
   - Students must settle their financial accounts (or promissory note) to receive a permit before Major Exams (Prelim, Midterm, Finals).
   - Permits are usually issued by the Finance Office.

3. **Incomplete Grades (INC)**:
   - Students have one (1) academic year to complete requirements for an INC grade.
   - Failure to complete results in an automatic 5.00 (Failed).

4. **Shifting Courses**:
   - Visit the Guidance Office for evaluation.
   - Secure a Shifting Form from the Registrar.
   - Credits will be evaluated by the new Program Head.
`;

export const IMPORTANT_OFFICES = [
  { name: "Registrar's Office", purpose: "Enrollment, grades, records, shifting, dropping." },
  { name: "Finance Office", purpose: "Tuition payments, assessment, promissory notes." },
  { name: "Guidance Office", purpose: "Counseling, career guidance, shifting evaluation." },
  { name: "Clinic", purpose: "Medical and dental concerns." },
  { name: "OSAS (Office of Student Affairs)", purpose: "Student organizations, discipline, ID validation." }
];
