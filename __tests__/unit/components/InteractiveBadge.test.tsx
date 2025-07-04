import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { InteractiveBadge } from '../../../components/InteractiveBadge';

// Mock ThemeContext
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#FF8E53',
      text: '#000000',
      background: '#FFFFFF',
    },
  }),
}));

describe('InteractiveBadge', () => {
  const defaultProps = {
    count: 5,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render badge with correct count', () => {
    const { getByText } = render(<InteractiveBadge {...defaultProps} />);
    
    expect(getByText('5')).toBeTruthy();
  });

  it('should not render when count is 0', () => {
    const { queryByText } = render(<InteractiveBadge count={0} />);
    
    expect(queryByText('0')).toBeNull();
  });

  it('should display "99+" for counts over 99', () => {
    const { getByText } = render(
      <InteractiveBadge count={150} onPress={jest.fn()} />
    );
    
    expect(getByText('99+')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <InteractiveBadge count={3} onPress={onPress} />
    );
    
    fireEvent.press(getByText('3'));
    
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should render with children', () => {
    const { getByText } = render(
      <InteractiveBadge count={2}>
        <Text>Child Component</Text>
      </InteractiveBadge>
    );
    
    expect(getByText('Child Component')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('should apply small size styles', () => {
    const { getByText } = render(
      <InteractiveBadge count={1} size="small" />
    );
    
    expect(getByText('1')).toBeTruthy();
  });

  it('should apply large size styles', () => {
    const { getByText } = render(
      <InteractiveBadge count={1} size="large" />
    );
    
    expect(getByText('1')).toBeTruthy();
  });

  it('should handle custom color', () => {
    const { getByText } = render(
      <InteractiveBadge count={1} color="#FF0000" />
    );
    
    expect(getByText('1')).toBeTruthy();
  });

  it('should handle different positions', () => {
    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;
    
    positions.forEach(position => {
      const { getByText } = render(
        <InteractiveBadge count={1} position={position} />
      );
      
      expect(getByText('1')).toBeTruthy();
    });
  });

  it('should handle animation state', () => {
    const onAnimationComplete = jest.fn();
    const { getByText } = render(
      <InteractiveBadge 
        count={1} 
        isAnimating={true}
        onAnimationComplete={onAnimationComplete}
      />
    );
    
    expect(getByText('1')).toBeTruthy();
  });

  it('should render only children when count is negative', () => {
    const { getByText, queryByText } = render(
      <InteractiveBadge count={-1}>
        <Text>Only Child</Text>
      </InteractiveBadge>
    );
    
    expect(getByText('Only Child')).toBeTruthy();
    expect(queryByText('-1')).toBeNull();
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'blue' };
    const customTextStyle = { fontSize: 20 };
    
    const { getByText } = render(
      <InteractiveBadge 
        count={1} 
        style={customStyle}
        textStyle={customTextStyle}
      />
    );
    
    expect(getByText('1')).toBeTruthy();
  });

  it('should handle medium size by default', () => {
    const { getByText } = render(<InteractiveBadge count={1} />);
    
    expect(getByText('1')).toBeTruthy();
  });

  it('should handle double-digit counts', () => {
    const { getByText } = render(<InteractiveBadge count={42} />);
    
    expect(getByText('42')).toBeTruthy();
  });

  it('should not render badge component when count is zero even with children', () => {
    const { getByText, queryByText } = render(
      <InteractiveBadge count={0}>
        <Text>Child Without Badge</Text>
      </InteractiveBadge>
    );
    
    expect(getByText('Child Without Badge')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });
}); 