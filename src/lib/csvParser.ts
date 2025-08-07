// /lib/csvParser.ts
import Papa from "papaparse";

interface CSVRow {
  [key: string]: string | undefined; // Allow undefined values
}

interface ParsedCSVData {
  phoneNumbers: string[];
  contacts: CSVRow[];
  totalCount: number;
  errors: string[];
}

export async function parseCSVFromUrl(
  csvUrl: string,
  phoneColumn: string = "phone"
): Promise<ParsedCSVData> {
  try {
    // Fetch CSV data from URL
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();

    return new Promise((resolve) => {
      Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors: string[] = [];
          const phoneNumbers: string[] = [];
          const contacts: CSVRow[] = results.data;

          // Extract and validate phone numbers
          contacts.forEach((row, index) => {
            // Use optional chaining and provide fallback
            const phone = row[phoneColumn] ?? "";

            if (!phone || phone.trim() === "") {
              errors.push(
                `Row ${
                  index + 1
                }: Missing phone number in column '${phoneColumn}'`
              );
              return;
            }

            // Basic phone number validation (remove spaces, dashes, parentheses)
            const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

            // Check if it's a valid phone number format
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(cleanPhone)) {
              errors.push(
                `Row ${index + 1}: Invalid phone number format: ${phone}`
              );
              return;
            }

            phoneNumbers.push(cleanPhone);
          });

          resolve({
            phoneNumbers,
            contacts,
            totalCount: contacts.length,
            errors,
          });
        }
      });
    });
  } catch (error) {
    throw new Error(
      `Failed to parse CSV: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function validatePhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(cleanPhone);
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "");
}
