import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Searchbar, Card, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../src/services/api';
import { Spirit } from '../../src/types';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function ManualSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Spirit[]>([]);
  const [searching, setSearching] = useState(false);
  
  const router = useRouter();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery?.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const spirits = await apiService.searchSpirits(searchQuery.trim());
      setResults(spirits ?? []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search spirits. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSpirit = (spirit: Spirit) => {
    router.replace({
      pathname: '/pour/create',
      params: { spiritId: spirit?.id ?? '' },
    });
  };

  const handleCreateNew = () => {
    router.replace('/camera/spirit-details');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Spirits</Text>
        <Searchbar
          placeholder="Search by name or distillery..."
          onChangeText={handleSearch}
          value={query}
          style={styles.searchBar}
          loading={searching}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item?.id ?? ''}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => handleSelectSpirit(item)}>
            <Card.Content>
              <Text style={styles.spiritName}>{item?.name ?? ''}</Text>
              {item?.distilleryName && (
                <Text style={styles.distillery}>{item.distilleryName}</Text>
              )}
              {item?.category && (
                <Text style={styles.category}>{item.category}</Text>
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          query?.trim() ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
              <Button
                mode="contained"
                onPress={handleCreateNew}
                style={styles.button}
              >
                Create New Spirit
              </Button>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Start typing to search spirits</Text>
              <Text style={styles.emptySubtext}>Or create a new spirit entry</Text>
              <Button
                mode="outlined"
                onPress={handleCreateNew}
                style={styles.button}
              >
                Create New Spirit
              </Button>
            </View>
          )
        }
      />

      <View style={styles.footer}>
        <Button
          mode="text"
          onPress={() => router.back()}
          labelStyle={styles.backButton}
        >
          Back
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.md,
  },
  searchBar: {
    backgroundColor: Colors.elevated,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  spiritName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  distillery: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  backButton: {
    color: Colors.textSecondary,
  },
});
