import Papa from "papaparse";

interface CSVRow {
  number?: string;
  name?: string;
  amount_owed?: string;
}

export async function parseCSVFromUrl(
  csvUrl: string,
  defaultCountryCode = "+91"
): Promise<{ number: string; name?: string; amount_owed?: string }[]> {
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const customers = results.data.map((row) => {
            const original = row.number?.trim() || "";
            const digitsOnly = original.replace(/[^\d]/g, "");

            let formattedNumber: string;

            if (original.startsWith("+") && digitsOnly.length >= 11) {
              formattedNumber = original;
            } else if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
              formattedNumber = `+${digitsOnly}`;
            } else if (digitsOnly.length === 10) {
              formattedNumber = `${defaultCountryCode}${digitsOnly}`;
            } else {
              throw new Error(`Invalid phone number format: ${original}`);
            }

            return {
              number: formattedNumber,
              name: row.name,
              amount_owed: row.amount_owed
            };
          });

          resolve(customers);
        } catch (err) {
          reject(err);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error:any) => reject(error),
    });
  });
}
