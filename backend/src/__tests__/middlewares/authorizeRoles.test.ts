import { Response } from "express";
import { AppError } from "../../utils/AppError";
import "../setup";
import { authorizeRolesMiddleware } from "../../middlewares/authorizeRolesMiddleware";

describe("Authorize Roles Middleware", () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      userRole: "user",
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it("should pass with correct role", () => {
    mockReq.userRole = "admin";
    const middleware = authorizeRolesMiddleware("admin");

    middleware(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should pass with role in array", () => {
    mockReq.userRole = "support";
    const middleware = authorizeRolesMiddleware(["admin", "support"]);

    middleware(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next with error for wrong role", () => {
    mockReq.userRole = "user";
    const middleware = authorizeRolesMiddleware("admin");

    middleware(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Accès refusé.");
    expect(error.statusCode).toBe(403);
  });

  it("should call next with error without userRole", () => {
    delete mockReq.userRole;
    const middleware = authorizeRolesMiddleware("admin");

    middleware(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Utilisateur non authentifié");
  });
});
