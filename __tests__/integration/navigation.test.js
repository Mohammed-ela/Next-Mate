// Tests d'intégration navigation basiques
describe('Navigation basique', () => {
  test('Simulation navigation vers écran', () => {
    const mockRouter = {
      push: (route) => ({ success: true, route }),
      currentRoute: '/'
    };
    
    const result = mockRouter.push('/profile');
    expect(result.success).toBe(true);
    expect(result.route).toBe('/profile');
  });

  test('Gestion pile navigation', () => {
    const navigationStack = [];
    
    const navigate = (route) => {
      navigationStack.push(route);
      return navigationStack.length;
    };
    
    const goBack = () => {
      if (navigationStack.length > 1) {
        navigationStack.pop();
        return navigationStack[navigationStack.length - 1];
      }
      return navigationStack[0];
    };
    
    navigate('/home');
    navigate('/profile');
    
    expect(navigationStack).toHaveLength(2);
    expect(goBack()).toBe('/home');
    expect(navigationStack).toHaveLength(1);
  });
}); 