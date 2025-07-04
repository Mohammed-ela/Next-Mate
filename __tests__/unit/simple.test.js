/* eslint-env jest */
// Tests basiques pour valider Jest
describe('Tests de base', () => {
  test('Jest fonctionne correctement', () => {
    expect(true).toBe(true);
  });

  test('Addition simple', () => {
    expect(2 + 2).toBe(4);
  });

  test('String contient du texte', () => {
    expect('NextMate').toContain('Mate');
  });
}); 