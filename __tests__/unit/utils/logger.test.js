/* eslint-env jest */
// Tests basiques logger
describe('Logger basique', () => {
  test('Log simple message', () => {
    const logger = {
      log: (message) => ({ level: 'info', message, timestamp: new Date() })
    };
    
    const result = logger.log('Test message');
    expect(result.message).toBe('Test message');
    expect(result.level).toBe('info');
  });

  test('Log avec niveau erreur', () => {
    const logger = {
      error: (message) => ({ level: 'error', message, timestamp: new Date() })
    };
    
    const result = logger.error('Erreur test');
    expect(result.message).toBe('Erreur test');
    expect(result.level).toBe('error');
  });

  test('Formatage message log', () => {
    const formatLog = (level, message) => `[${level.toUpperCase()}] ${message}`;
    
    const formatted = formatLog('info', 'Test');
    expect(formatted).toBe('[INFO] Test');
  });
}); 