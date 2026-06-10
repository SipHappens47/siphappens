import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, IconButton, Avatar, ActivityIndicator, Card, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { BadgesGrid } from '../../src/components/gamification/BadgesGrid';
import { TasteSummaryCard } from '../../src/components/gamification/TasteSummaryCard';
import { JourneyMapSection } from '../../src/components/gamification/JourneyMapSection';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { Badge, TasteSummary, Pour, User, Connection, FellowSipper } from '../../src/types';

type ConnectionStatus = 'none' | 'connected' | 'pending-sent' | 'pending-received';

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const { userId = '' } = useLocalSearchParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tasteSummary, setTasteSummary] = useState<TasteSummary | null>(null);
  const [publicPours, setPublicPours] = useState<Pour[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPublicProfile();
    }
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      
      // userId might be an array from route params, ensure it's a string
      const userIdString = Array.isArray(userId) ? userId[0] : userId;
      console.log('[PublicProfile] Loading user profile for:', userIdString);
      
      const [profileData, badgesData, tasteSummaryData, poursData, connections, pendingRequests] = await Promise.all([
        apiService.getPublicProfile(userIdString),
        apiService.getPublicUserBadges(userIdString),
        apiService.getPublicUserTasteSummary(userIdString),
        apiService.getUserPublicPours(userIdString),
        apiService.getConnections(),
        apiService.getPendingRequests(),
      ]);
      
      console.log('[PublicProfile] Profile data:', profileData);
      
      setProfile(profileData ?? null);
      setBadges(badgesData ?? []);
      setTasteSummary(tasteSummaryData);
      setPublicPours(poursData ?? []);
      setIsOfficial((profileData as any)?.isOfficial ?? false);

      // Fetch mute status
      try {
        const muteData = await apiService.getMuteStatus(userIdString);
        setIsMuted(muteData?.isMuted ?? false);
      } catch { /* ignore if not connected */ }
      
      // Check connection status
      // connections is FellowSipper[], check if the userId is in the list
      const isConnected = (connections ?? []).some(
        (conn: FellowSipper) => 
          conn?.user?.id === userIdString
      );
      
      if (isConnected) {
        const connection = (connections ?? []).find(
          (conn: FellowSipper) => 
            conn?.user?.id === userIdString
        );
        setConnectionStatus('connected');
        setConnectionId(connection?.connectionId ?? null);
      } else {
        // Check if there's a pending request
        const pendingSent = (pendingRequests ?? []).find(
          (conn: Connection) => 
            conn?.receiver?.id === userIdString && conn?.status?.toLowerCase() === 'pending'
        );
        const pendingReceived = (pendingRequests ?? []).find(
          (conn: Connection) => 
            conn?.initiator?.id === userIdString && conn?.status?.toLowerCase() === 'pending'
        );
        
        if (pendingSent) {
          setConnectionStatus('pending-sent');
          setConnectionId(pendingSent?.id ?? null);
        } else if (pendingReceived) {
          setConnectionStatus('pending-received');
          setConnectionId(pendingReceived?.id ?? null);
        } else {
          setConnectionStatus('none');
          setConnectionId(null);
        }
      }
      
      if (profileData?.profilePhoto) {
        const url = await uploadService.getImageUrl(profileData.profilePhoto, 'view');
        setProfilePhotoUri(url);
      }
    } catch (error: any) {
      console.error('[PublicProfile] Failed to load:', error?.response?.data?.message ?? error?.message);
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setActionLoading(true);
      const userIdString = Array.isArray(userId) ? userId[0] : userId;
      await apiService.sendConnectionRequestById(userIdString);
      setConnectionStatus('pending-sent');
      Alert.alert('Success', 'Connection request sent!');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!connectionId) return;
    
    try {
      setActionLoading(true);
      await apiService.acceptConnectionRequest(connectionId);
      setConnectionStatus('connected');
      Alert.alert('Success', 'Connection request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!connectionId) return;
    
    Alert.alert(
      'Remove Connection',
      'Are you sure you want to remove this connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await apiService.removeConnection(connectionId);
              setConnectionStatus('none');
              setConnectionId(null);
              Alert.alert('Success', 'Connection removed');
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message ?? 'Failed to remove connection');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMuteToggle = async () => {
    const userIdString = Array.isArray(userId) ? userId[0] : String(userId);
    try {
      setMuteLoading(true);
      if (isMuted) {
        await apiService.unmuteUser(userIdString);
        setIsMuted(false);
      } else {
        await apiService.muteUser(userIdString);
        setIsMuted(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to update mute status');
    } finally {
      setMuteLoading(false);
    }
  };

  const renderConnectionButton = () => {
    if (actionLoading) {
      return (
        <Button
          mode="contained"
          disabled
          style={styles.connectionButton}
          contentStyle={styles.buttonContent}
        >
          <ActivityIndicator size="small" color={Colors.background} />
        </Button>
      );
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <Button
            mode="outlined"
            onPress={handleRemoveConnection}
            style={styles.connectionButton}
            contentStyle={styles.buttonContent}
            icon="check"
          >
            Connected
          </Button>
        );
      case 'pending-sent':
        return (
          <Button
            mode="outlined"
            disabled
            style={styles.connectionButton}
            contentStyle={styles.buttonContent}
          >
            Request Pending
          </Button>
        );
      case 'pending-received':
        return (
          <Button
            mode="contained"
            onPress={handleAcceptRequest}
            style={styles.connectionButton}
            contentStyle={styles.buttonContent}
            icon="account-plus"
          >
            Accept Request
          </Button>
        );
      case 'none':
      default:
        return (
          <Button
            mode="contained"
            onPress={handleSendRequest}
            style={styles.connectionButton}
            contentStyle={styles.buttonContent}
            icon="account-plus"
          >
            Send Connection Request
          </Button>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>{profile?.name ?? 'User Profile'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo Section */}
        <View style={styles.profilePhotoSection}>
          {profilePhotoUri ? (
            <Avatar.Image
              size={120}
              source={{ uri: profilePhotoUri }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon
              size={120}
              icon={isOfficial ? 'star-circle' : 'account'}
              style={[styles.avatar, isOfficial && styles.officialAvatar]}
            />
          )}
          {isOfficial && (
            <View style={styles.officialBadgeContainer}>
              <MaterialCommunityIcons name="star-circle" size={18} color="#D4A017" />
              <Text style={styles.officialBadgeLabel}>Official</Text>
            </View>
          )}
        </View>

        {/* Stats: Pours + Friends */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.poursCount ?? 0}</Text>
            <Text style={styles.statLabel}>Pours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.connectionsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.cheersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Cheers</Text>
          </View>
        </View>

        {/* Connection Button + Mute Toggle */}
        <View style={styles.connectionButtonContainer}>
          {isOfficial ? (
            <Button
              mode={isMuted ? 'contained' : 'outlined'}
              onPress={handleMuteToggle}
              loading={muteLoading}
              disabled={muteLoading}
              style={styles.connectionButton}
              contentStyle={styles.buttonContent}
              icon={isMuted ? 'volume-off' : 'volume-high'}
            >
              {isMuted ? 'Unmute from Feed' : 'Mute from Feed'}
            </Button>
          ) : (
            renderConnectionButton()
          )}
        </View>

        {/* Profile Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.infoValue}>{profile?.name || 'Not set'}</Text>
              {isOfficial && (
                <View style={styles.officialInlineBadge}>
                  <MaterialCommunityIcons name="star-circle" size={14} color="#D4A017" />
                  <Text style={styles.officialInlineText}>Official</Text>
                </View>
              )}
            </View>
          </View>

          {profile?.bio ? (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>{profile.bio}</Text>
            </View>
          ) : null}

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Experience Level</Text>
            <Text style={styles.infoValue}>{profile?.experienceLevel ?? 'Curious'}</Text>
          </View>
        </View>

        {/* Gamification Section */}
        {tasteSummary && (
          <TasteSummaryCard 
            tasteSummary={tasteSummary} 
            isOwnProfile={userId === currentUser?.id}
          />
        )}

        {badges && badges.length > 0 && (
          <BadgesGrid badges={badges} />
        )}

        {tasteSummary && badges && badges.length > 0 && (
          <JourneyMapSection 
            tasteSummary={tasteSummary} 
            badges={badges}
            isOwnProfile={userId === currentUser?.id}
          />
        )}

        {/* Public Pours Section */}
        {publicPours?.length > 0 && (
          <View style={styles.poursSection}>
            <Text style={styles.sectionTitle}>🥃 Public Pours ({publicPours.length})</Text>
            {publicPours.map((pour) => (
              <Card key={pour?.id} style={styles.pourCard}>
                <Card.Content>
                  <Text style={styles.spiritName}>{pour?.spirit?.name ?? 'Unknown Spirit'}</Text>
                  {pour?.spirit?.distilleryName && (
                    <Text style={styles.distilleryName}>{pour.spirit.distilleryName}</Text>
                  )}
                  {pour?.whyItHit && (
                    <Text style={styles.whyItHit}>{pour.whyItHit}</Text>
                  )}
                  {(pour?.flavorTags?.length ?? 0) > 0 && (
                    <View style={styles.flavorTags}>
                      {(pour?.flavorTags ?? []).map((tag) => (
                        <View key={tag?.id} style={styles.flavorTag}>
                          <Text style={styles.flavorTagText}>{tag?.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {publicPours?.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No public pours yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  officialAvatar: {
    backgroundColor: '#D4A017',
  },
  officialBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  officialBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4A017',
    letterSpacing: 0.3,
  },
  officialInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  officialInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A017',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.divider,
  },
  connectionButtonContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  connectionButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoItem: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  poursSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.md,
  },
  pourCard: {
    backgroundColor: Colors.surface,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  spiritName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  distilleryName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  whyItHit: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  flavorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flavorTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  flavorTagText: {
    fontSize: 12,
    color: Colors.background,
    fontWeight: '500',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
