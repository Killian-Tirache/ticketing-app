import { Request, Response } from "express";
import { validateObjectId } from "../../middlewares/validateObjectId";
import { AppError } from "../../utils/AppError";
import "../setup";

describe("Validate ObjectId Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it("should pass with valid ObjectId", () => {
    mockReq.params = { id: "507f1f77bcf86cd799439011" };

    const middleware = validateObjectId("id");
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should call next with error for invalid ObjectId", () => {
    mockReq.params = { id: "invalid-id" };

    const middleware = validateObjectId("id");
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toContain("ObjectId");
    expect(error.statusCode).toBe(400);
  });

  it("should use default param name 'id'", () => {
    mockReq.params = { id: "507f1f77bcf86cd799439011" };

    const middleware = validateObjectId();
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should validate custom param name", () => {
    mockReq.params = { companyId: "507f1f77bcf86cd799439011" };

    const middleware = validateObjectId("companyId");
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });
});
