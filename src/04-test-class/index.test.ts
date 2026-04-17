import {
  BankAccount,
  getBankAccount,
  InsufficientFundsError,
  SynchronizationFailedError,
  TransferFailedError,
} from './index';
import { random } from 'lodash';

jest.mock('lodash', () => ({
  random: jest.fn(),
}));

const mockRandom = jest.mocked(random);

describe('BankAccount', () => {
  let bankAccount: BankAccount;

  beforeEach(() => {
    bankAccount = getBankAccount(100);
    mockRandom.mockReset();
  });

  test('should create account with initial balance', () => {
    expect(bankAccount.getBalance()).toBe(100);
  });

  test('should throw InsufficientFundsError error when withdrawing more than balance', () => {
    expect(() => bankAccount.withdraw(200)).toThrow(InsufficientFundsError);
    expect(bankAccount.getBalance()).toBe(100);
  });

  test('should throw error when transferring more than balance', () => {
    const toAccount = getBankAccount(0);

    expect(() => bankAccount.transfer(200, toAccount)).toThrow(
      InsufficientFundsError,
    );
    expect(bankAccount.getBalance()).toBe(100);
    expect(toAccount.getBalance()).toBe(0);
  });

  test('should throw error when transferring to the same account', () => {
    expect(() => bankAccount.transfer(50, bankAccount)).toThrow(
      TransferFailedError,
    );
    expect(bankAccount.getBalance()).toBe(100);
  });

  test('should deposit money', () => {
    bankAccount.deposit(50);
    expect(bankAccount.getBalance()).toBe(150);
  });

  test('should withdraw money', () => {
    bankAccount.withdraw(50);
    expect(bankAccount.getBalance()).toBe(50);
  });

  test('should transfer money', () => {
    const toAccount = getBankAccount(20);

    bankAccount.transfer(30, toAccount);

    expect(bankAccount.getBalance()).toBe(70);
    expect(toAccount.getBalance()).toBe(50);
  });

  test('fetchBalance should return number in case if request did not failed', async () => {
    mockRandom.mockReturnValueOnce(42).mockReturnValueOnce(1);

    await expect(bankAccount.fetchBalance()).resolves.toBe(42);
  });

  test('should set new balance if fetchBalance returned number', async () => {
    mockRandom.mockReturnValueOnce(88).mockReturnValueOnce(1);

    await bankAccount.synchronizeBalance();

    expect(bankAccount.getBalance()).toBe(88);
  });

  test('should throw SynchronizationFailedError if fetchBalance returned null', async () => {
    mockRandom.mockReturnValueOnce(55).mockReturnValueOnce(0);

    await expect(bankAccount.synchronizeBalance()).rejects.toThrow(
      SynchronizationFailedError,
    );
    expect(bankAccount.getBalance()).toBe(100);
  });
});
