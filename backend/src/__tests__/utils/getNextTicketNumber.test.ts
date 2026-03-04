import {
  getNextTicketNumberForCompany,
  getCurrentTicketNumber,
} from "../../utils/getNextTicketNumber";
import { Counter } from "../../models/counter.model";
import { createTestCompany } from "../helpers/testHelpers";
import "../setup";

describe("getNextTicketNumberForCompany", () => {
  beforeEach(async () => {
    await Counter.deleteMany({});
  });

  it("should start at 1 for first ticket", async () => {
    const company = await createTestCompany();
    const currentYear = new Date().getFullYear();

    const result = await getNextTicketNumberForCompany(company._id.toString());

    expect(result.ticketNumber).toBe(1);
    expect(result.year).toBe(currentYear);
  });

  it("should increment for same company and year", async () => {
    const company = await createTestCompany();

    const result1 = await getNextTicketNumberForCompany(company._id.toString());
    const result2 = await getNextTicketNumberForCompany(company._id.toString());
    const result3 = await getNextTicketNumberForCompany(company._id.toString());

    expect(result1.ticketNumber).toBe(1);
    expect(result2.ticketNumber).toBe(2);
    expect(result3.ticketNumber).toBe(3);
  });

  it("should have separate counters for different companies", async () => {
    const company1 = await createTestCompany();
    const company2 = await createTestCompany();

    const result1 = await getNextTicketNumberForCompany(
      company1._id.toString(),
    );
    const result2 = await getNextTicketNumberForCompany(
      company2._id.toString(),
    );

    expect(result1.ticketNumber).toBe(1);
    expect(result2.ticketNumber).toBe(1);
  });

  it("should create counter document on first call", async () => {
    const company = await createTestCompany();
    const currentYear = new Date().getFullYear();
    const counterId = `ticket_company_${company._id}_${currentYear}`;

    await getNextTicketNumberForCompany(company._id.toString());

    const counter = await Counter.findById(counterId);
    expect(counter).not.toBeNull();
    expect(counter?.sequence).toBe(1);
    expect(counter?.year).toBe(currentYear);
  });
});

describe("getCurrentTicketNumber", () => {
  beforeEach(async () => {
    await Counter.deleteMany({});
  });

  it("should return 0 for company with no tickets", async () => {
    const company = await createTestCompany();

    const result = await getCurrentTicketNumber(company._id.toString());

    expect(result).toBe(0);
  });

  it("should return current sequence after creating tickets", async () => {
    const company = await createTestCompany();

    await getNextTicketNumberForCompany(company._id.toString());
    await getNextTicketNumberForCompany(company._id.toString());
    await getNextTicketNumberForCompany(company._id.toString());

    const result = await getCurrentTicketNumber(company._id.toString());

    expect(result).toBe(3);
  });

  it("should support specific year query", async () => {
    const company = await createTestCompany();
    const counterId2025 = `ticket_company_${company._id}_2025`;

    await Counter.create({
      _id: counterId2025,
      sequence: 50,
      year: 2025,
    });

    const result = await getCurrentTicketNumber(company._id.toString(), 2025);

    expect(result).toBe(50);
  });
});
