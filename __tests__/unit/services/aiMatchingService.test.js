/* eslint-env jest */
// Tests basiques service IA matching
describe('Service IA Matching basique', () => {
  test('Calcul compatibilité simple', () => {
    const calculateCompatibility = (user1, user2) => {
      const commonGames = user1.games.filter(game => user2.games.includes(game));
      return commonGames.length > 0 ? 80 : 20;
    };
    
    const user1 = { games: ['Valorant', 'CS2'] };
    const user2 = { games: ['Valorant', 'LoL'] };
    const user3 = { games: ['Fortnite'] };
    
    expect(calculateCompatibility(user1, user2)).toBe(80);
    expect(calculateCompatibility(user1, user3)).toBe(20);
  });

  test('Génération suggestion basique', () => {
    const generateSuggestion = (user) => {
      return `Joueur de ${user.favoriteGame} recherche partenaire !`;
    };
    
    const user = { favoriteGame: 'Valorant' };
    const suggestion = generateSuggestion(user);
    
    expect(suggestion).toBe('Joueur de Valorant recherche partenaire !');
  });

  test('Filtrage par niveau', () => {
    const filterByLevel = (users, targetLevel) => {
      return users.filter(user => 
        Math.abs(user.level - targetLevel) <= 2
      );
    };
    
    const users = [
      { name: 'User1', level: 5 },
      { name: 'User2', level: 7 },
      { name: 'User3', level: 10 }
    ];
    
    const filtered = filterByLevel(users, 6);
    expect(filtered).toHaveLength(2);
  });
}); 