import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Application {
  id: string;
  job_id: string;
  message?: string;
  status: string;
  applied_at: string;
  job_details?: {
    title: string;
    job_type: string;
    hourly_rate: number;
    location_city: string;
    location_state: string;
    job_date: string;
    start_time: string;
    end_time: string;
  };
  professional_details?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profession_type?: string;
    experience_years?: number;
  };
}

interface User {
  id: string;
  role: string;
}

interface ApplicationsScreenProps {
  user: User;
}

const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({ user }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const endpoint = user.role === 'professional' 
        ? '/api/applications/my-applications'
        : '/api/applications/received';

      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatJobType = (jobType: string) => {
    return jobType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'accepted':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const renderProfessionalApplication = ({ item: application }: { item: Application }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <Text style={styles.jobTitle}>{application.job_details?.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
          <Text style={styles.statusText}>{application.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.jobType}>
        {formatJobType(application.job_details?.job_type || '')}
      </Text>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.detailText}>
          {application.job_details?.location_city}, {application.job_details?.location_state}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.detailText}>
          {application.job_details?.job_date && 
            format(new Date(application.job_details.job_date), 'MMM dd, yyyy')
          } • {application.job_details?.start_time} - {application.job_details?.end_time}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="cash-outline" size={16} color="#666" />
        <Text style={styles.detailText}>
          ${application.job_details?.hourly_rate}/hour
        </Text>
      </View>

      {application.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Your message:</Text>
          <Text style={styles.messageText}>{application.message}</Text>
        </View>
      )}

      <Text style={styles.appliedDate}>
        Applied on {format(new Date(application.applied_at), 'MMM dd, yyyy')}
      </Text>
    </View>
  );

  const renderClientApplication = ({ item: application }: { item: Application }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <Text style={styles.jobTitle}>{application.job_details?.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
          <Text style={styles.statusText}>{application.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.professionalInfo}>
        <Text style={styles.professionalName}>
          {application.professional_details?.first_name} {application.professional_details?.last_name}
        </Text>
        
        {application.professional_details?.profession_type && (
          <Text style={styles.professionType}>
            {formatJobType(application.professional_details.profession_type)}
          </Text>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {application.professional_details?.email}
          </Text>
        </View>

        {application.professional_details?.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {application.professional_details.phone}
            </Text>
          </View>
        )}

        {application.professional_details?.experience_years && (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {application.professional_details.experience_years} years experience
            </Text>
          </View>
        )}
      </View>

      <View style={styles.jobInfo}>
        <Text style={styles.jobInfoTitle}>Job Details:</Text>
        <Text style={styles.jobInfoText}>
          {application.job_details?.job_date && 
            format(new Date(application.job_details.job_date), 'MMM dd, yyyy')
          } • {application.job_details?.start_time} - {application.job_details?.end_time}
        </Text>
        <Text style={styles.jobInfoText}>
          ${application.job_details?.hourly_rate}/hour
        </Text>
      </View>

      {application.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Applicant's message:</Text>
          <Text style={styles.messageText}>{application.message}</Text>
        </View>
      )}

      <Text style={styles.appliedDate}>
        Applied on {format(new Date(application.applied_at), 'MMM dd, yyyy')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {user.role === 'professional' ? 'My Applications' : 'Received Applications'}
        </Text>
        <Text style={styles.subtitle}>
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={applications}
        renderItem={user.role === 'professional' ? renderProfessionalApplication : renderClientApplication}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.applicationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No applications found</Text>
            <Text style={styles.emptySubtext}>
              {user.role === 'professional' 
                ? 'Apply to jobs to see your applications here'
                : 'Applications from professionals will appear here'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  applicationsList: {
    padding: 16,
  },
  applicationCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  jobType: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  professionalInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  professionType: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 8,
  },
  jobInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jobInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  jobInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  messageContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  appliedDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ApplicationsScreen;