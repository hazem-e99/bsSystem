# Updated Student Registration Schema

## Overview
تم تحديث Schema التسجيل ليتطابق مع StudentRegistrationDTO الرسمي.

## Schema الكامل

```typescript
interface StudentRegistrationDTO {
  firstName: string;           // minLength: 2, maxLength: 20
  lastName: string;            // minLength: 2, maxLength: 20
  nationalId: string;          // pattern: ^\d{14}$
  email: string;               // format: email, minLength: 1
  phoneNumber: string;         // format: tel, minLength: 1, pattern: ^01[0-2,5]{1}[0-9]{8}$
  department: StudentDepartment; // enum values
  yearOfStudy: AcademicYear;   // enum values
  password: string;            // format: password, minLength: 1
  confirmPassword: string;     // format: password, minLength: 1
}
```

## Validation Rules

### 1. **First Name & Last Name**
- **Required**: ✅
- **Min Length**: 2 characters
- **Max Length**: 20 characters

### 2. **National ID**
- **Required**: ✅
- **Pattern**: `^\d{14}$` (exactly 14 digits)
- **Example**: `19370037866089`

### 3. **Email**
- **Required**: ✅
- **Format**: Valid email address
- **Min Length**: 1 character

### 4. **Phone Number**
- **Required**: ✅
- **Format**: Egyptian phone number
- **Pattern**: `^01[0-2,5]{1}[0-9]{8}$`
- **Valid Examples**:
  - `01012345678` ✅
  - `01112345678` ✅
  - `01212345678` ✅
  - `01512345678` ✅
- **Invalid Examples**:
  - `01312345678` ❌ (3 not allowed)
  - `01412345678` ❌ (4 not allowed)
  - `01612345678` ❌ (6 not allowed)

### 5. **Department**
- **Required**: ✅
- **Type**: Enum from predefined list

### 6. **Year of Study**
- **Required**: ✅
- **Type**: Enum from predefined list

### 7. **Password**
- **Required**: ✅
- **Min Length**: 1 character
- **Format**: password

### 8. **Confirm Password**
- **Required**: ✅
- **Must Match**: password field

## Available Departments

### Medical & Health Sciences
- Medicine
- Dentistry
- Pharmacy
- VeterinaryMedicine
- Nursing

### Engineering
- CivilEngineering
- MechanicalEngineering
- ElectricalEngineering
- ComputerEngineering
- ChemicalEngineering
- Architecture

### Computer & Technology
- ComputerScience
- InformationTechnology
- SoftwareEngineering
- DataScience

### Business & Management
- BusinessAdministration
- Accounting
- Finance
- Marketing
- Economics
- Management

### Law & Humanities
- Law
- ArabicLanguageAndLiterature
- EnglishLanguageAndLiterature
- History
- Philosophy
- Geography
- PoliticalScience
- Psychology
- Sociology
- SocialWork
- InternationalRelations

### Natural Sciences
- Physics
- Chemistry
- Biology
- Mathematics
- Agriculture
- AgriculturalEngineering

### Arts & Education
- Education
- FineArts
- Music
- GraphicDesign
- MassCommunication
- Journalism
- PhysicalEducation
- TourismAndHotels

## Available Academic Years

### Undergraduate
- PreparatoryYear
- FirstYear
- SecondYear
- ThirdYear
- FourthYear
- FifthYear
- SixthYear
- SeventhYear

### Graduate Studies
- MastersFirstYear
- MastersSecondYear
- MastersThirdYear

### PhD Programs
- PhDFirstYear
- PhDSecondYear
- PhDThirdYear
- PhDFourthYear
- PhDFifthYear
- PhDSixthYear

### Medical Residency
- ResidencyFirstYear
- ResidencySecondYear
- ResidencyThirdYear
- ResidencyFourthYear
- ResidencyFifthYear

### Fellowships
- FellowshipFirstYear
- FellowshipSecondYear

### Special Programs
- ExchangeStudent
- VisitingStudent
- NonDegreeStudent
- ContinuingEducation

### Diploma Programs
- DiplomaFirstYear
- DiplomaSecondYear
- DiplomaThirdYear

### Professional Programs
- ProfessionalFirstYear
- ProfessionalSecondYear
- ProfessionalThirdYear
- ProfessionalFourthYear

### Other
- RepeatYear
- ThesisWriting
- DissertationWriting

## Example Valid Data

```json
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "nationalId": "19370037866089",
  "email": "ahmed@example.com",
  "phoneNumber": "01012345678",
  "department": "Medicine",
  "yearOfStudy": "PreparatoryYear",
  "password": "password123",
  "confirmPassword": "password123"
}
```

## Testing

### 1. **Test with Node.js**
```bash
node test-global-endpoints.js
```

### 2. **Test with cURL**
```bash
curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/registration-student \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "nationalId": "19370037866089",
    "email": "ahmed@example.com",
    "phoneNumber": "01012345678",
    "department": "Medicine",
    "yearOfStudy": "PreparatoryYear",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### 3. **Test in Browser**
1. Open `/register`
2. Fill form with valid data
3. Check console for validation logs

## Validation Functions

```typescript
import { 
  validateStudentRegistration,
  validateNationalId,
  validatePhoneNumber,
  validateEmail,
  validateFirstName,
  validateLastName
} from '@/utils/validateStudentRegistration';

// Validate complete form
const validation = validateStudentRegistration(userData);

// Validate specific fields
const isNationalIdValid = validateNationalId('19370037866089');
const isPhoneValid = validatePhoneNumber('01012345678');
const isEmailValid = validateEmail('test@example.com');
const isFirstNameValid = validateFirstName('أحمد');
const isLastNameValid = validateLastName('محمد');
```

## Error Messages

### Common Validation Errors
- `First name must be at least 2 characters long`
- `First name must not exceed 20 characters`
- `National ID must be exactly 14 digits`
- `Please enter a valid email address`
- `Please enter a valid phone number (format: 01XXXXXXXXX)`
- `Passwords do not match`

## Notes

### 1. **Phone Number Format**
- Must start with `01`
- Second digit must be `0`, `1`, `2`, or `5`
- Total length: 11 digits
- Examples: `010`, `011`, `012`, `015`

### 2. **National ID**
- Must be exactly 14 digits
- No spaces or special characters
- Example: `19370037866089`

### 3. **Names**
- Minimum 2 characters
- Maximum 20 characters
- Supports Arabic and English

### 4. **Password**
- No minimum length requirement (minLength: 1)
- Must match confirmPassword
- Both fields are required
