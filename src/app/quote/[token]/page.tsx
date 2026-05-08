"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface QuoteItem {
  id: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  unit: string;
}

interface QuotePortalData {
  vendor: { id: string; name: string; code: string; email: string | null };
  rfq: {
    id: string;
    rfqNumber: string;
    indentNumber: string;
    dueDate: string | null;
    remarks: string | null;
    status: string;
    items: QuoteItem[];
  };
  submittedAt: string | null;
  closed: boolean;
}

interface ItemEntry {
  materialId: string;
  unitPrice: string;
  gstPercent: string;
  remarks: string;
}

export default function PublicQuotePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<QuotePortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ItemEntry[]>([]);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/public/quote/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          setError(err.error || "Failed to load");
          return null;
        }
        return r.json();
      })
      .then((json: QuotePortalData | null) => {
        if (!json) return;
        setData(json);
        setEntries(
          json.rfq.items.map((it) => ({
            materialId: it.materialId,
            unitPrice: "",
            gstPercent: "",
            remarks: "",
          }))
        );
      });
  }, [token]);

  function updateEntry(index: number, field: keyof ItemEntry, value: string) {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (entries.some((it) => !it.unitPrice)) {
      alert("Please enter a unit price for every item");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/public/quote/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteNumber: quoteNumber || null,
        validUntil: validUntil || null,
        remarks: remarks || null,
        items: entries,
      }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setSubmitting(false);
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Link unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (submitted || data.submittedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">Quote submitted</h1>
          <p className="text-sm text-gray-600">
            Thank you, {data.vendor.name}. Your quote for {data.rfq.rfqNumber}{" "}
            has been received.
          </p>
        </div>
      </div>
    );
  }

  if (data.closed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">RFQ closed</h1>
          <p className="text-sm text-gray-600">
            This RFQ is no longer accepting quotes.
          </p>
        </div>
      </div>
    );
  }

  const dueDate = data.rfq.dueDate
    ? new Date(data.rfq.dueDate).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">RFQ {data.rfq.rfqNumber}</h1>
          <p className="text-sm text-gray-600">For: {data.vendor.name}</p>
          {dueDate && (
            <p className="text-sm text-gray-600">Quote due by {dueDate}</p>
          )}
          {data.rfq.remarks && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Remarks:</span> {data.rfq.remarks}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Your Pricing</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="p-2">Material</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Unit Price</th>
                    <th className="p-2">GST %</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rfq.items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{item.materialName}</div>
                        <div className="text-xs text-gray-500">
                          {item.materialCode}
                        </div>
                      </td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2">{item.unit}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={entries[index]?.unitPrice ?? ""}
                          onChange={(e) =>
                            updateEntry(index, "unitPrice", e.target.value)
                          }
                          className="w-28 rounded border px-2 py-1"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={entries[index]?.gstPercent ?? ""}
                          onChange={(e) =>
                            updateEntry(index, "gstPercent", e.target.value)
                          }
                          className="w-20 rounded border px-2 py-1"
                          placeholder="18"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={entries[index]?.remarks ?? ""}
                          onChange={(e) =>
                            updateEntry(index, "remarks", e.target.value)
                          }
                          className="w-40 rounded border px-2 py-1"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Quote Number
              </label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded border px-3 py-2"
              rows={3}
              placeholder="Optional notes for the buyer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-blue-600 px-4 py-2 text-white font-medium disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
