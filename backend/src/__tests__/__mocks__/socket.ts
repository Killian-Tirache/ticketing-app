export const initSocket = jest.fn();
export const getIO = jest.fn().mockReturnValue({
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
});
