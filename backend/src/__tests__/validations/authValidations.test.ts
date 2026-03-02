import { loginValidation } from "../../validations/authValidations";

describe("Auth Validations", () => {
  it("should validate correct login data", () => {
    const result = loginValidation.validate({
      email: "test@test.com",
      password: "Password123!",
    });

    expect(result.error).toBeUndefined();
  });

  it("should reject invalid email", () => {
    const result = loginValidation.validate({
      email: "invalid-email",
      password: "Password123!",
    });

    expect(result.error).toBeDefined();
  });
});
