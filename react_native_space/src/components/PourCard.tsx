import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Pour } from '../types';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { FlavorChips } from './FlavorChips';
import { apiService } from '../services/api';

interface PourCardProps {
  pour: Pour;
  onPress: () => void;
}

export const PourCard: React.FC<PourCardProps> = ({ pour, onPress }) => {
  const [pourImageUrl, setPourImageUrl] = useState<string | null>(null);
  const [bottleImageUrl, setBottleImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPourImage();
    loadBottleImage();
  }, [pour?.image, pour?.spirit?.bottleImage]);

  const loadPourImage = async () => {
    if (!pour?.image) {
      setPourImageUrl(null);
      return;
    }

    try {
      const response = await apiService.getFileUrl(pour.image, 'view');
      setPourImageUrl(response?.url ?? null);
    } catch (error) {
      console.error('Failed to load pour image:', error);
      setPourImageUrl(null);
    }
  };

  const loadBottleImage = async () => {
    if (!pour?.spirit?.bottleImage) {
      setBottleImageUrl(null);
      return;
    }

    try {
      // Check if it's already a URL
      if (pour.spirit.bottleImage.startsWith('http')) {
        setBottleImageUrl(pour.spirit.bottleImage);
      } else {
        // It's a file ID, fetch the URL
        const response = await apiService.getFileUrl(pour.spirit.bottleImage, 'view');
        setBottleImageUrl(response?.url ?? null);
      }
    } catch (error) {
      console.error('Failed to load bottle image:', error);
      setBottleImageUrl(null);
    }
  };
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date?.toLocaleDateString?.('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) ?? '';
    } catch {
      return '';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      {pourImageUrl && (
        <Image
          source={{ uri: pourImageUrl }}
          style={styles.pourImage}
        />
      )}
      <View style={styles.content}>
        {bottleImageUrl && (
          <Image
            source={{ uri: bottleImageUrl }}
            style={styles.bottleImage}
          />
        )}
        <View style={styles.textContent}>
          <Text style={styles.spiritName}>{pour?.spirit?.name ?? 'Unknown Spirit'}</Text>
          <Text style={styles.distillery}>{pour?.spirit?.distilleryName ?? ''}</Text>
          {pour?.spirit?.category && (
            <Text style={styles.category}>{pour.spirit.category}</Text>
          )}
          <Text style={styles.whyItHit} numberOfLines={2}>
            {truncateText(pour?.whyItHit ?? '', 100)}
          </Text>
          {(pour?.flavorTags?.length ?? 0) > 0 && (
            <View style={styles.tagsContainer}>
              {(pour?.flavorTags ?? []).slice(0, 3).map((tag) => (
                <View key={tag?.id ?? ''} style={styles.tag}>
                  <Text style={styles.tagText}>{tag?.name ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.date}>{formatDate(pour?.createdAt ?? '')}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface, // Card surface
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pourImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  bottleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
    resizeMode: 'cover',
  },
  textContent: {
    flex: 1,
  },
  spiritName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text, // Primary text
    marginBottom: 4,
  },
  distillery: {
    fontSize: 14,
    color: Colors.textSecondary, // Secondary text
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary, // Secondary text - NOT accent
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  whyItHit: {
    fontSize: 14,
    color: Colors.text, // Primary text
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.sm,
  },
  tag: {
    backgroundColor: Colors.elevated, // Elevated surface
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: Colors.textSecondary, // Secondary text
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted, // Muted text
  },
});
