import { Request, Response, NextFunction } from "express";
import { errorMiddleware } from "../../middlewares/errorMiddleware";
import { AppError } from "../../utils/AppError";
import "../setup";

describe("Error Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      originalUrl: "/test",
      method: "GET",
      body: {},
    };
    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should handle AppError", () => {
    const error = new AppError("Test error", 400, "TEST_ERROR");

    errorMiddleware(error, mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Test error",
      details: [],
    });
  });

  it("should handle generic Error", () => {
    const error = new Error("Generic error");

    errorMiddleware(error, mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Generic error",
      details: [],
    });
  });

  it("should handle Mongoose duplicate key errors", () => {
    const error: any = {
      code: 11000,
      keyPattern: { email: 1 },
    };

    errorMiddleware(error, mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Une entrée avec ce email existe déjà.",
      details: [],
    });
  });

  it("should use field label for known fields in duplicate errors", () => {
    const error: any = {
      code: 11000,
      keyPattern: { name: 1 },
    };

    errorMiddleware(error, mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Une entrée avec ce nom existe déjà.",
      details: [],
    });
  });

  it("should not send response if headers already sent", () => {
    const error = new Error("Test error");
    mockRes.headersSent = true;

    errorMiddleware(error, mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it("should include error details if provided", () => {
    const error: any = {
      statusCode: 400,
      message: "Validation failed",
      details: ["Field 'email' is required", "Field 'password' is too short"],
    };

    errorMiddleware(error, mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Validation failed",
      details: ["Field 'email' is required", "Field 'password' is too short"],
    });
  });
});
