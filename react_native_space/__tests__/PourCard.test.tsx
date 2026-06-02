import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PourCard } from '../src/components/PourCard';
import { Pour } from '../src/types';

describe('PourCard', () => {
  const mockPour: Pour = {
    id: '1',
    userId: 'user1',
    spiritId: 'spirit1',
    spirit: {
      id: 'spirit1',
      name: 'Lagavulin 16',
      distilleryName: 'Lagavulin',
      category: 'Whisky',
      bottleImage: 'https://lovescotch.com/cdn/shop/files/Lagavulin16YearOldIslaySingleMaltScotchWhisky_grande.png?v=1768062318',
      createdAt: '2024-01-01T00:00:00Z',
    },
    whyItHit: 'Amazing smoky flavor with a hint of sweetness. Perfect for a cold evening.',
    isShared: false,
    flavorTags: [
      { id: '1', name: 'Smoky' },
      { id: '2', name: 'Sweet' },
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  it('should render spirit name and distillery', () => {
    const { getByText } = render(
      <PourCard pour={mockPour} onPress={() => {}} />
    );

    expect(getByText('Lagavulin 16')).toBeTruthy();
    expect(getByText('Lagavulin')).toBeTruthy();
  });

  it('should render category', () => {
    const { getByText } = render(
      <PourCard pour={mockPour} onPress={() => {}} />
    );

    expect(getByText('Whisky')).toBeTruthy();
  });

  it('should render flavor tags', () => {
    const { getByText } = render(
      <PourCard pour={mockPour} onPress={() => {}} />
    );

    expect(getByText('Smoky')).toBeTruthy();
    expect(getByText('Sweet')).toBeTruthy();
  });

  it('should call onPress when card is tapped', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <PourCard pour={mockPour} onPress={onPressMock} />
    );

    fireEvent.press(getByText('Lagavulin 16'));

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should handle pour without spirit data gracefully', () => {
    const pourWithoutSpirit: Pour = {
      ...mockPour,
      spirit: undefined,
    };

    const { getByText } = render(
      <PourCard pour={pourWithoutSpirit} onPress={() => {}} />
    );

    expect(getByText('Unknown Spirit')).toBeTruthy();
  });
});
