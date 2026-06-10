import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { adminService } from '../services/admin';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL } from '../constants/admin';

interface UnverifiedDistillery {
  id: string;
  name: string;
  region?: string;
  country?: string;
  logo?: string;
  bio?: string;
  spirittypes?: string;
  createdat: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export function AdminVerificationContent() {
  const [distilleries, setDistilleries] = useState<UnverifiedDistillery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user } = useAuth();

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      loadDistilleries();
    }
  }, [isAdmin]);

  const loadDistilleries = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUnverifiedDistilleries();
      setDistilleries(data ?? []);
    } catch (error: any) {
      console.error('Failed to load unverified distilleries:', error);
      Alert.alert('Error', 'Failed to load distilleries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerify = async (distilleryId: string, distilleryName: string) => {
    try {
      setProcessingId(distilleryId);
      await adminService.verifyDistillery(distilleryId);
      Alert.alert('Success', `${distilleryName} has been verified!`);
      setDistilleries(prev => prev.filter(d => d.id !== distilleryId));
    } catch (error: any) {
      console.error('Failed to verify distillery:', error);
      Alert.alert('Error', 'Failed to verify distillery');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (distilleryId: string, distilleryName: string) => {
    Alert.alert(
      'Reject Distillery',
      `Are you sure you want to reject ${distilleryName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(distilleryId);
              await adminService.rejectDistillery(distilleryId);
              Alert.alert('Rejected', `${distilleryName} has been rejected`);
              setDistilleries(prev => prev.filter(d => d.id !== distilleryId));
            } catch (error: any) {
              console.error('Failed to reject distillery:', error);
              Alert.alert('Error', 'Failed to reject distillery');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLocation = (region?: string, country?: string) => {
    if (region && country) return `${region}, ${country}`;
    if (country) return country;
    if (region) return region;
    return 'Location not specified';
  };

  if (!isAdmin) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="lock" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>Admin access required</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDistilleries();
          }}
          tintColor={Colors.primary}
        />
      }
    >
      {loading && distilleries.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="loading" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : distilleries.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-circle" size={64} color={Colors.success} />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>No distilleries pending verification</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            {distilleries.length} Distiller{distilleries.length === 1 ? 'y' : 'ies'} Pending Verification
          </Text>

          {distilleries.map((distillery) => (
            <Card key={distillery.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.distilleryInfo}>
                    <Text style={styles.distilleryName}>{distillery.name}</Text>
                    <Text style={styles.location}>
                      {formatLocation(distillery.region, distillery.country)}
                    </Text>
                    <Text style={styles.date}>Created: {formatDate(distillery.createdat)}</Text>
                  </View>
                </View>

                {distillery.bio ? (
                  <Text style={styles.bio} numberOfLines={2}>
                    {distillery.bio}
                  </Text>
                ) : null}

                {distillery.spirittypes ? (
                  <View style={styles.spiritTypes}>
                    {distillery.spirittypes.split(',').map((type, idx) => (
                      <Chip key={idx} style={styles.chip} textStyle={styles.chipText}>
                        {type.trim()}
                      </Chip>
                    ))}
                  </View>
                ) : null}

                <View style={styles.ownerInfo}>
                  <MaterialCommunityIcons name="account" size={16} color={Colors.textSecondary} />
                  <Text style={styles.ownerText}>
                    {distillery.owner.name} ({distillery.owner.email})
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Button
                    mode="contained"
                    onPress={() => handleVerify(distillery.id, distillery.name)}
                    style={styles.verifyButton}
                    labelStyle={styles.verifyButtonLabel}
                    loading={processingId === distillery.id}
                    disabled={processingId === distillery.id}
                    icon="check-circle"
                  >
                    Verify
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleReject(distillery.id, distillery.name)}
                    style={styles.rejectButton}
                    labelStyle={styles.rejectButtonLabel}
                    disabled={processingId === distillery.id}
                    icon="close-circle"
                  >
                    Reject
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  distilleryInfo: {
    flex: 1,
  },
  distilleryName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  spiritTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: Colors.primaryLight,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipText: {
    fontSize: 12,
    color: Colors.primary,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ownerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: Colors.success,
  },
  verifyButtonLabel: {
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    borderColor: Colors.error,
  },
  rejectButtonLabel: {
    color: Colors.error,
  },
});
