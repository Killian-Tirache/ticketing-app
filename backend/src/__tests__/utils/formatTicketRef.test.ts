import { parseTicketRef, formatTicketRef } from "../../utils/formatTicketRef";
import { createTestCompany } from "../helpers/testHelpers";
import "../setup";

describe("formatTicketRef", () => {
  it("should format ticket reference with year", async () => {
    const company = await createTestCompany({
      name: "Test Company",
      ticketPrefix: "TEST",
    });

    const ref = await formatTicketRef(42, 2026, company._id.toString());

    expect(ref).toBe("TEST-0042-2026");
  });

  it("should pad ticket number with zeros", async () => {
    const company = await createTestCompany({
      name: "Test Company",
      ticketPrefix: "ABC",
    });

    const ref = await formatTicketRef(5, 2026, company._id.toString());

    expect(ref).toBe("ABC-0005-2026");
  });

  it("should return fallback for non-existent company", async () => {
    const fakeId = "507f1f77bcf86cd799439011";

    const ref = await formatTicketRef(10, 2026, fakeId);

    expect(ref).toBe("TICKET-0010-2026");
  });
});

describe("parseTicketRef", () => {
  it("should parse valid ticket reference with year", () => {
    const result = parseTicketRef("ALPHA-0042-2026");

    expect(result).not.toBeNull();
    expect(result?.prefix).toBe("ALPHA");
    expect(result?.number).toBe(42);
    expect(result?.year).toBe(2026);
  });

  it("should parse reference with numbers in prefix", () => {
    const result = parseTicketRef("ABC123-0001-2025");

    expect(result).not.toBeNull();
    expect(result?.prefix).toBe("ABC123");
    expect(result?.number).toBe(1);
    expect(result?.year).toBe(2025);
  });

  it("should return null for invalid format", () => {
    expect(parseTicketRef("INVALID")).toBeNull();
    expect(parseTicketRef("ALPHA-0042")).toBeNull(); // Sans année
    expect(parseTicketRef("alpha-0042-2026")).toBeNull(); // Lowercase
    expect(parseTicketRef("ALPHA_0042_2026")).toBeNull(); // Underscores
  });

  it("should return null for invalid year", () => {
    expect(parseTicketRef("ALPHA-0042-1999")).toBeNull(); // Année < 2020
    expect(parseTicketRef("ALPHA-0042-2200")).toBeNull(); // Année > 2100
    expect(parseTicketRef("ALPHA-0042-202")).toBeNull(); // Année incomplète
  });

  it("should handle different number lengths", () => {
    expect(parseTicketRef("TEST-1-2026")).not.toBeNull();
    expect(parseTicketRef("TEST-0001-2026")).not.toBeNull();
    expect(parseTicketRef("TEST-99999-2026")).not.toBeNull();
  });
});
