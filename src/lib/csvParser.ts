// /lib/csvParser.ts
import Papa from "papaparse";

interface CSVRow {
  [key: string]: string | undefined; // Allow undefined values
}

interface ContactData {
  name: string;
  phoneNumber: string;
  amountOwed: number;
  originalRow: CSVRow;
}

interface ParsedCSVData {
  contacts: ContactData[];
  totalCount: number;
  validCount: number;
  errors: string[];
  summary: {
    totalAmount: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  };
}

interface ParseOptions {
  nameColumn?: string;
  phoneColumn?: string;
  amountColumn?: string;
  requireAllFields?: boolean;
}

export async function parseCSVFromUrl(
  csvUrl: string,
  options: ParseOptions = {}
): Promise<ParsedCSVData> {
  const {
    nameColumn = "name",
    phoneColumn = "number",
    amountColumn = "amount_owed",
    requireAllFields = true,
  } = options;

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
        dynamicTyping: false, // Keep everything as strings initially
        complete: (results) => {
          const errors: string[] = [];
          const contacts: ContactData[] = [];
          const rawContacts: CSVRow[] = results.data;

          // Check if required columns exist
          if (rawContacts.length > 0) {
            const headers = Object.keys(rawContacts[0]);
            const missingColumns = [];

            if (!headers.includes(nameColumn)) missingColumns.push(nameColumn);
            if (!headers.includes(phoneColumn))
              missingColumns.push(phoneColumn);
            if (!headers.includes(amountColumn))
              missingColumns.push(amountColumn);

            if (missingColumns.length > 0) {
              errors.push(
                `Missing required columns: ${missingColumns.join(", ")}`
              );
              errors.push(`Available columns: ${headers.join(", ")}`);
            }
          }

          // Process each row
          rawContacts.forEach((row, index) => {
            const rowNum = index + 1;
            const rowErrors: string[] = [];

            // Extract and validate name
            const name = (row[nameColumn] ?? "").trim();
            if (!name) {
              rowErrors.push(`Missing name in column '${nameColumn}'`);
            }

            // Extract and validate phone number
            const phone = (row[phoneColumn] ?? "").trim();
            let cleanPhone = "";
            if (!phone) {
              rowErrors.push(`Missing phone number in column '${phoneColumn}'`);
            } else {
              cleanPhone = formatPhoneNumber(phone);
              if (!validatePhoneNumber(cleanPhone)) {
                rowErrors.push(`Invalid phone number format: ${phone}`);
              }
            }

            // Extract and validate amount owed
            const amountStr = (row[amountColumn] ?? "").trim();
            let amountOwed = 0;
            if (!amountStr) {
              rowErrors.push(`Missing amount in column '${amountColumn}'`);
            } else {
              // Clean the amount string (remove currency symbols, commas, etc.)
              const cleanAmountStr = amountStr.replace(/[$,\s]/g, "");
              amountOwed = parseFloat(cleanAmountStr);

              if (isNaN(amountOwed)) {
                rowErrors.push(`Invalid amount format: ${amountStr}`);
              } else if (amountOwed < 0) {
                rowErrors.push(`Negative amount not allowed: ${amountStr}`);
              }
            }

            // Add row-specific errors to main errors array
            if (rowErrors.length > 0) {
              errors.push(`Row ${rowNum}: ${rowErrors.join("; ")}`);
            }

            // Add to contacts array if we have all required fields or if not requiring all fields
            if (requireAllFields && rowErrors.length > 0) {
              // Skip this row if we require all fields and there are errors
              return;
            }

            if (
              !requireAllFields ||
              (name && cleanPhone && !isNaN(amountOwed))
            ) {
              contacts.push({
                name: name || "Unknown",
                phoneNumber: cleanPhone || "Invalid",
                amountOwed: isNaN(amountOwed) ? 0 : amountOwed,
                originalRow: row,
              });
            }
          });

          // Calculate summary statistics
          const validAmounts = contacts
            .map((c) => c.amountOwed)
            .filter((amount) => !isNaN(amount) && amount >= 0);

          const summary = {
            totalAmount: validAmounts.reduce((sum, amount) => sum + amount, 0),
            averageAmount:
              validAmounts.length > 0
                ? validAmounts.reduce((sum, amount) => sum + amount, 0) /
                  validAmounts.length
                : 0,
            minAmount: validAmounts.length > 0 ? Math.min(...validAmounts) : 0,
            maxAmount: validAmounts.length > 0 ? Math.max(...validAmounts) : 0,
          };

          resolve({
            contacts,
            totalCount: rawContacts.length,
            validCount: contacts.length,
            errors,
            summary,
          });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error:any) => {
          throw new Error(`Papa Parse error: ${error.message}`);
        },
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

export function validateAmount(amountStr: string): {
  isValid: boolean;
  amount: number;
} {
  const cleanAmountStr = amountStr.replace(/[$,\s]/g, "");
  const amount = parseFloat(cleanAmountStr);

  return {
    isValid: !isNaN(amount) && amount >= 0,
    amount: isNaN(amount) ? 0 : amount,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Helper function to parse CSV from file input
export async function parseCSVFromFile(
  file: File,
  options: ParseOptions = {}
): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        const blob = new Blob([csvText], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const result = await parseCSVFromUrl(url, options);
        URL.revokeObjectURL(url); // Clean up
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}