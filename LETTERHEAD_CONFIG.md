# Church Letterhead Configuration

The PDF consent form has been simplified to include only name and signature with church letterhead.

## Placeholders to Replace

In the file `lib/pdf-generator.js`, replace these placeholders with actual church information:

- `[CHURCH_REG_NUMBER]` - Replace with the actual church registration number
- `[CHURCH_ADDRESS]` - Replace with the full church address
- `[CHURCH_PHONE]` - Replace with the church phone number
- `[CHURCH_EMAIL]` - Replace with the church email address

## Example Replacement

```javascript
// Replace this:
page.drawText('Registration Number: [CHURCH_REG_NUMBER]', {

// With this:
page.drawText('Registration Number: 12345678', {
```

## Current PDF Content

The simplified consent form now includes:

1. **Church Letterhead** with:
   - Church name
   - Registration number
   - Address
   - Phone and email

2. **Consent Statement** explaining membership commitments

3. **Member Information** section with just the full name

4. **Signature Sections** for:
   - Member signature with date
   - Church representative signature with date

5. **Footer** with church registration number

This simplified format focuses on the essential information while maintaining the official church letterhead as requested.
