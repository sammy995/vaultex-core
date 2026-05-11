"use client";

import { useRef, useState } from "react";
import { Upload, X, Database, ChevronDown, ChevronUp, FileText } from "lucide-react";

export interface CsvData {
  fileName: string;
  headers: string[];
  rows: string[][];
}

interface Props {
  data: CsvData | null;
  onDataLoaded: (data: CsvData | null) => void;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQuotes) { inQuotes = true; continue; }
      if (ch === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; continue; }
      if (ch === '"' && inQuotes) { inQuotes = false; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseRow);
  return { headers, rows };
}

// ── Column classification ─────────────────────────────────────────────────
// These keywords identify columns that hold direct personal identifiers.
// Everything else is treated as an analytics dimension and passed unmasked.
const PII_COLUMN_KEYWORDS = [
  "name", "email", "ssn", "social", "phone", "mobile", "fax",
  "account", "acct", "loan id", "loan_id", "dob", "birth", "date of birth",
  "address", "addr", "zip", "postal", "routing",
];

function classifyColumns(headers: string[]): { piiCols: string[]; analyticsCols: string[] } {
  const piiCols: string[] = [];
  const analyticsCols: string[] = [];
  for (const h of headers) {
    const lower = h.toLowerCase();
    if (PII_COLUMN_KEYWORDS.some((k) => lower.includes(k))) {
      piiCols.push(h);
    } else {
      analyticsCols.push(h);
    }
  }
  return { piiCols, analyticsCols };
}

export function csvToSystemPrompt(data: CsvData): string {
  const maxRows = 200;
  const sliced = data.rows.slice(0, maxRows);
  const { piiCols, analyticsCols } = classifyColumns(data.headers);

  const dataLines = sliced
    .map((row, ri) =>
      "Row " + (ri + 1) + ": " +
      row.map((cell, i) => (data.headers[i] ?? i) + ": " + cell).join(" | ")
    )
    .join("\n");

  const truncNote =
    data.rows.length > maxRows
      ? "\n[Dataset truncated: showing first " + maxRows + " of " + data.rows.length + " rows]"
      : "";

  return (
    "You are a banking analytics assistant operating under a regulatory privacy-preserving tokenization layer (GLBA / GDPR compliant).\n\n" +

    "DATASET: " + data.fileName + " — " + data.rows.length + " records × " + data.headers.length + " columns\n" +
    "All columns: " + data.headers.join(", ") + "\n\n" +

    "━━ PRIVACY MODEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "PROTECTED fields (PII — identity-linked, masked per regulation):\n" +
    "  " + (piiCols.length ? piiCols.join(", ") : "none detected") + "\n" +
    "  → Each unique value is replaced with a DETERMINISTIC, SESSION-SCOPED token\n" +
    "    e.g. {{PERSON_1}}, {{SSN_1}}, {{ACCT_2}}, {{EMAIL_3}}, {{DATE_1}}\n" +
    "  → The SAME token ALWAYS refers to the SAME individual within this session.\n" +
    "    {{PERSON_1}} in row 3 is the identical person as {{PERSON_1}} in row 7.\n" +
    "  → Use tokens as stable primary keys for individual-level analysis.\n\n" +

    "ANALYTICS fields (unmasked — real values, safe for computation):\n" +
    "  " + (analyticsCols.length ? analyticsCols.join(", ") : "all columns") + "\n" +
    "  → All numeric amounts, scores, rates, flags and categories are ACTUAL values.\n" +
    "  → Use these for aggregation, statistics, distributions, and risk analysis.\n\n" +

    "━━ WHAT YOU CAN DO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "✓ Compute averages, totals, min/max on Balance, Credit Score, Income, Rate, DPD\n" +
    "✓ Group and count by Risk Flag, Loan Type, Employment Status, State, Collateral\n" +
    "✓ Identify high-risk records (e.g. Days Past Due > 30, Risk Flag = HIGH)\n" +
    "✓ Reference specific records by their token: \"{{PERSON_2}}'s credit score is 688\"\n" +
    "✓ Cross-row correlation: same token = same individual across all rows\n" +
    "✗ Do NOT attempt to infer, guess, or reconstruct masked identity values\n\n" +

    "━━ DATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    dataLines + truncNote
  );
}

const SAMPLE_CSV = `Name,Email,SSN,Date of Birth,Phone,City,State,Account Number,Loan ID,Loan Type,Balance,Annual Income,Credit Score,Interest Rate (%),Monthly Payment,Days Past Due,Collateral,Employment Status,Risk Flag
Jane Smith,jane.smith@acme.com,123-45-6789,1985-03-14,415-555-0192,San Francisco,CA,ACC-00198234,LOAN-2024-0041,Mortgage,42500.00,95000,742,4.75,1240.00,0,Real Estate,Employed,LOW
Robert Chen,r.chen@globex.io,987-65-4321,1979-11-02,212-555-0847,New York,NY,ACC-00874512,LOAN-2024-0078,Auto,128000.00,210000,688,6.90,2850.00,15,Vehicle,Self-Employed,MEDIUM
Priya Patel,priya.patel@initech.net,456-78-9012,1992-07-28,512-555-0374,Austin,TX,ACC-00312677,LOAN-2024-0119,Personal,7800.00,58000,795,5.10,310.00,0,Unsecured,Employed,LOW
Marcus Johnson,m.johnson@umbrella.co,321-54-8765,1971-01-19,312-555-0561,Chicago,IL,ACC-00564390,LOAN-2024-0203,Business,315000.00,480000,601,8.45,6200.00,62,Equipment,Self-Employed,HIGH
Linda Nguyen,linda.n@hooli.com,654-32-1098,1988-09-05,650-555-0283,Palo Alto,CA,ACC-00091847,LOAN-2024-0257,Mortgage,55750.00,115000,760,4.50,890.00,0,Real Estate,Employed,LOW
David Kim,d.kim@piedpiper.io,789-01-2345,1995-04-22,408-555-0715,San Jose,CA,ACC-00729103,LOAN-2024-0301,Auto,19200.00,72000,711,7.20,540.00,30,Vehicle,Employed,MEDIUM
Sarah O'Brien,s.obrien@vehement.co,234-56-7890,1968-12-31,713-555-0926,Houston,TX,ACC-00448261,LOAN-2024-0388,Business,87400.00,155000,589,9.80,2100.00,45,Unsecured,Self-Employed,HIGH
Amara Osei,a.osei@initech.net,876-54-3210,1983-06-17,404-555-0142,Atlanta,GA,ACC-00632019,LOAN-2024-0412,Personal,23600.00,64000,734,5.95,720.00,0,Unsecured,Employed,LOW
Carlos Rivera,c.rivera@globex.io,543-21-0987,1976-02-09,305-555-0489,Miami,FL,ACC-00115872,LOAN-2024-0467,Mortgage,198000.00,135000,648,7.60,2430.00,90,Real Estate,Self-Employed,HIGH
Ethan Brooks,e.brooks@hooli.com,210-98-7654,1990-08-14,206-555-0338,Seattle,WA,ACC-00987345,LOAN-2024-0519,Auto,34100.00,88000,723,6.30,810.00,0,Vehicle,Employed,LOW
Fatima Al-Rashid,f.alrashid@piedpiper.io,135-79-2468,1980-05-03,214-555-0671,Dallas,TX,ACC-00456789,LOAN-2024-0574,Business,425000.00,620000,667,8.10,8750.00,22,Equipment,Self-Employed,MEDIUM
George Tanaka,g.tanaka@acme.com,864-20-9753,1973-10-27,617-555-0294,Boston,MA,ACC-00234156,LOAN-2024-0631,Mortgage,162000.00,175000,779,4.25,1580.00,0,Real Estate,Employed,LOW
`;


function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_pii_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvUpload({ data, onDataLoaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function handleFile(file: File) {
    setError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { setError("Could not parse CSV"); return; }
      onDataLoaded({ fileName: file.name, headers, rows });
      setExpanded(true);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Loaded state ─────────────────────────────────────────────────────────
  if (data) {
    const previewRows = data.rows.slice(0, 6);
    return (
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(0,212,255,0.025)",
          flexShrink: 0,
        }}
      >
        {/* Header bar */}
        <div
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "7px 16px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <Database size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 700 }}>
            {data.fileName}
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "100px",
              padding: "1px 8px",
            }}
          >
            {data.rows.length} rows · {data.headers.length} cols
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--color-safe)",
              background: "var(--color-safe-dim)",
              border: "1px solid var(--border-safe)",
              borderRadius: "100px",
              padding: "1px 8px",
              fontWeight: 600,
            }}
          >
            IN CONTEXT
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDataLoaded(null);
                setExpanded(false);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "2px 4px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
              title="Remove dataset"
            >
              <X size={12} />
            </button>
            {expanded ? (
              <ChevronUp size={12} style={{ color: "var(--text-muted)" }} />
            ) : (
              <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
        </div>

        {/* Expanded preview table */}
        {expanded && (
          <div style={{ padding: "0 16px 10px", overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: "0.7rem",
                width: "100%",
                minWidth: "300px",
              }}
            >
              <thead>
                <tr>
                  {data.headers.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "4px 10px",
                        textAlign: "left",
                        color: "var(--text-muted)",
                        borderBottom: "1px solid var(--border-subtle)",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {data.headers.map((_, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "3px 10px",
                          color: "var(--text-secondary)",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          whiteSpace: "nowrap",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.68rem",
                        }}
                      >
                        {row[ci] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rows.length > 6 && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                +{data.rows.length - 6} more rows — all {data.rows.length} rows injected into context
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Upload state ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "5px 14px",
          borderRadius: "8px",
          border: `1px dashed ${dragging ? "var(--color-primary)" : "rgba(255,255,255,0.12)"}`,
          background: dragging ? "rgba(0,212,255,0.06)" : "transparent",
          cursor: "pointer",
          fontSize: "0.75rem",
          color: dragging ? "var(--color-primary)" : "var(--text-muted)",
          transition: "all var(--transition-base)",
          lineHeight: 1,
        }}
      >
        <FileText size={12} />
        <span>Upload CSV with PII data</span>
        <Upload size={11} style={{ opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>or</span>
        <button
          onClick={downloadSampleCSV}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            lineHeight: 1,
            transition: "all 150ms ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
          title="Download a sample CSV with realistic PII data"
        >
          ↓ Sample CSV
        </button>
      </div>
      {error && (
        <span style={{ fontSize: "0.72rem", color: "var(--color-danger)" }}>{error}</span>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
