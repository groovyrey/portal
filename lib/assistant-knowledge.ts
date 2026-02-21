export const SCHOOL_INFO = {
  name: "La Concepcion College",
  acronym: "LCC",
  location: "San Jose del Monte, Bulacan",
  motto: "Changing Lives for the Better",
  coreValues: [
    "Leadership",
    "Competence",
    "Character"
  ],
  socials: {
    facebook: "https://www.facebook.com/laconcepcioncollege",
    website: "https://www.lcc.edu.ph"
  }
};

export const BUILDING_CODES = {
  "FCM": "Francisco C. Menu (Main Building)",
  "FCM2": "Francisco C. Menu Annex",
  "SOL": "School of Law Building",
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
