jest.mock('path', () => {
  const actual = jest.requireActual<typeof import('path')>('path');

  return {
    ...actual,
    join: jest.fn((...args: Parameters<typeof actual.join>) =>
      actual.join(...args),
    ),
  };
});

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');

  return {
    ...actual,
    existsSync: jest.fn(),
  };
});

jest.mock('fs/promises', () => {
  const actual =
    jest.requireActual<typeof import('fs/promises')>('fs/promises');

  return {
    ...actual,
    readFile: jest.fn(),
  };
});

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { readFileAsynchronously, doStuffByTimeout, doStuffByInterval } from '.';

describe('doStuffByTimeout', () => {
  let setTimeoutSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  test('should set timeout with provided callback and timeout', () => {
    const callback = jest.fn();

    doStuffByTimeout(callback, 1500);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callback, 1500);
  });

  test('should call callback only after timeout', () => {
    const callback = jest.fn();

    doStuffByTimeout(callback, 2000);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1999);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('doStuffByInterval', () => {
  let setIntervalSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    setIntervalSpy = jest.spyOn(global, 'setInterval');
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
  });

  test('should set interval with provided callback and timeout', () => {
    const callback = jest.fn();

    doStuffByInterval(callback, 500);

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(callback, 500);
  });

  test('should call callback multiple times after multiple intervals', () => {
    const callback = jest.fn();

    doStuffByInterval(callback, 300);

    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(3);
  });
});

describe('readFileAsynchronously', () => {
  beforeEach(() => {
    (join as jest.Mock).mockClear();
    (existsSync as jest.Mock).mockClear();
    (readFile as jest.Mock).mockClear();
  });

  test('should call join with pathToFile', async () => {
    const pathToFile = 'data/sample.txt';
    (existsSync as jest.Mock).mockReturnValue(false);

    await readFileAsynchronously(pathToFile);

    expect(join).toHaveBeenCalledWith(expect.any(String), pathToFile);
  });

  test('should return null if file does not exist', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const result = await readFileAsynchronously('missing.txt');

    expect(result).toBeNull();
    expect(readFile).not.toHaveBeenCalled();
  });

  test('should return file content if file exists', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFile as jest.Mock).mockResolvedValue(Buffer.from('file contents'));

    const result = await readFileAsynchronously('present.txt');

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(result).toBe('file contents');
  });
});
