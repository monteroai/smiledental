import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Job {
  id: string;
  title: string;
  job_type: string;
  description?: string;
  hourly_rate: number;
  location_address: string;
  location_city: string;
  location_state: string;
  location_zip: string;
  job_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  applications_count: number;
}

interface User {
  id: string;
  role: string;
  profession_type?: string;
}

interface JobsScreenProps {
  user: User;
}

type ViewMode = 'list' | 'calendar' | 'map';

const JobsScreen: React.FC<JobsScreenProps> = ({ user }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchText, setSearchText] = useState('');
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  const jobTypes = [
    { value: '', label: 'All Positions' },
    { value: 'dental_hygienist', label: 'Dental Hygienist' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'dental_assistant', label: 'Dental Assistant' },
    { value: 'front_desk', label: 'Front Desk' },
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchText, selectedJobType]);

  const fetchJobs = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchText) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchText.toLowerCase()) ||
          job.location_city.toLowerCase().includes(searchText.toLowerCase()) ||
          job.location_state.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedJobType) {
      filtered = filtered.filter((job) => job.job_type === selectedJobType);
    }

    setFilteredJobs(filtered);
  };

  const applyToJob = async (jobId: string) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/jobs/${jobId}/apply`,
        { message: 'I am interested in this position.' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Your application has been submitted!');
      fetchJobs(); // Refresh to update application count
    } catch (error: any) {
      console.error('Error applying to job:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to apply to job. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const formatJobType = (jobType: string) => {
    return jobType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderJobCard = ({ item: job }: { item: Job }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobType}>{formatJobType(job.job_type)}</Text>
      </View>

      <View style={styles.jobDetail}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.jobDetailText}>
          {job.location_city}, {job.location_state}
        </Text>
      </View>

      <View style={styles.jobDetail}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.jobDetailText}>
          {format(new Date(job.job_date), 'MMM dd, yyyy')} • {job.start_time} - {job.end_time}
        </Text>
      </View>

      <View style={styles.jobDetail}>
        <Ionicons name="cash-outline" size={16} color="#666" />
        <Text style={styles.jobDetailText}>${job.hourly_rate}/hour</Text>
      </View>

      {job.description && (
        <Text style={styles.jobDescription} numberOfLines={3}>
          {job.description}
        </Text>
      )}

      <View style={styles.jobFooter}>
        <Text style={styles.applicationsCount}>
          {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
        </Text>
        
        {user.role === 'professional' && (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => applyToJob(job.id)}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      {[
        { mode: 'list', icon: 'list-outline', label: 'List' },
        { mode: 'calendar', icon: 'calendar-outline', label: 'Calendar' },
        { mode: 'map', icon: 'map-outline', label: 'Map' },
      ].map((option) => (
        <TouchableOpacity
          key={option.mode}
          style={[
            styles.viewModeButton,
            viewMode === option.mode && styles.activeViewModeButton,
          ]}
          onPress={() => setViewMode(option.mode as ViewMode)}
        >
          <Ionicons
            name={option.icon as any}
            size={20}
            color={viewMode === option.mode ? '#2196F3' : '#666'}
          />
          <Text
            style={[
              styles.viewModeButtonText,
              viewMode === option.mode && styles.activeViewModeButtonText,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location or job..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobTypeFilters}>
        {jobTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.jobTypeFilter,
              selectedJobType === type.value && styles.activeJobTypeFilter,
            ]}
            onPress={() => setSelectedJobType(type.value)}
          >
            <Text
              style={[
                styles.jobTypeFilterText,
                selectedJobType === type.value && styles.activeJobTypeFilterText,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      );
    }

    switch (viewMode) {
      case 'list':
        return (
          <FlatList
            data={filteredJobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.jobsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No jobs found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search filters
                </Text>
              </View>
            }
          />
        );
      case 'calendar':
        return (
          <View style={styles.placeholderContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.placeholderText}>Calendar View</Text>
            <Text style={styles.placeholderSubtext}>Coming soon!</Text>
          </View>
        );
      case 'map':
        return (
          <View style={styles.placeholderContainer}>
            <Ionicons name="map-outline" size={64} color="#ccc" />
            <Text style={styles.placeholderText}>Map View</Text>
            <Text style={styles.placeholderSubtext}>Coming soon!</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderViewModeSelector()}
      {renderFilters()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeViewModeButton: {
    backgroundColor: '#e3f2fd',
  },
  viewModeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeViewModeButtonText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  jobTypeFilters: {
    flexDirection: 'row',
  },
  jobTypeFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeJobTypeFilter: {
    backgroundColor: '#2196F3',
  },
  jobTypeFilterText: {
    fontSize: 14,
    color: '#666',
  },
  activeJobTypeFilterText: {
    color: '#ffffff',
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
  jobsList: {
    padding: 16,
  },
  jobCard: {
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
  jobHeader: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  jobType: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  jobDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applicationsCount: {
    fontSize: 12,
    color: '#666',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default JobsScreen;