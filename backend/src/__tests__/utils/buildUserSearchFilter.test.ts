import { buildUserSearchFilter } from "../../utils/buildUserSearchFilter";
import { User } from "../../models/user.model";
import bcrypt from "bcryptjs";

const makeUser = async (firstName: string, lastName: string, email: string) => {
  return User.create({
    firstName,
    lastName,
    email,
    password: await bcrypt.hash("Test123!", 12),
    role: "user",
  });
};

describe("buildUserSearchFilter", () => {
  afterEach(async () => {
    await User.deleteMany({ email: /@searchtest\.com$/ });
  });

  it("should match single word against firstName", async () => {
    await makeUser("Alice", "Smith", "alice@searchtest.com");
    const filter = await buildUserSearchFilter("Alice");
    const users = await User.find(filter);
    expect(users.some((u) => u.firstName === "Alice")).toBe(true);
  });

  it("should match full name (firstName + lastName)", async () => {
    await makeUser("Bob", "Martin", "bob@searchtest.com");
    const filter = await buildUserSearchFilter("Bob Martin");
    const users = await User.find(filter);
    expect(users.some((u) => u.lastName === "Martin")).toBe(true);
  });

  it("should return empty result for unknown name", async () => {
    const filter = await buildUserSearchFilter("ZZZUnknownXXX");
    const users = await User.find(filter);
    expect(users.length).toBe(0);
  });

  it("should match by email", async () => {
    await makeUser("Carol", "Doe", "carol@searchtest.com");
    const filter = await buildUserSearchFilter("carol@searchtest.com");
    const users = await User.find(filter);
    expect(users.some((u) => u.email === "carol@searchtest.com")).toBe(true);
  });
});
