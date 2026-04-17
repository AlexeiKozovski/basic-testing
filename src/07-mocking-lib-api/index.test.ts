jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

import axios from 'axios';
import { throttledGetDataFromApi, THROTTLE_TIME } from './index';

describe('throttledGetDataFromApi', () => {
  let mockGet: jest.Mock;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockGet = jest.fn().mockResolvedValue({ data: { id: 42, name: 'test' } });
    (axios.create as jest.Mock).mockReturnValue({ get: mockGet });
    (axios.create as jest.Mock).mockClear();
    mockGet.mockClear();
    jest.advanceTimersByTime(THROTTLE_TIME + 1);
  });

  test('should create instance with provided base url', async () => {
    await throttledGetDataFromApi('/users/1');

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://jsonplaceholder.typicode.com',
    });
  });

  test('should perform request to correct provided url', async () => {
    await throttledGetDataFromApi('/posts/2');

    expect(mockGet).toHaveBeenCalledWith('/posts/2');
  });

  test('should return response data', async () => {
    mockGet.mockResolvedValueOnce({ data: { title: 'hello' } });

    const result = await throttledGetDataFromApi('/todos/1');

    expect(result).toStrictEqual({ title: 'hello' });
  });
});
