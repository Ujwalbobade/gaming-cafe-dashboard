import React, { useState, useEffect } from 'react';
import { Monitor, Gamepad2, Users, Clock, DollarSign, Settings, Power, Play, Square, AlertCircle, CheckCircle, Plus, Trash2, Edit3, Shield, Lock, Unlock, BarChart3, Eye, EyeOff, LogOut } from 'lucide-react';
import { getStations, createStation, deleteStation, lockStation, unlockStation, startSession, endSession, addTime } from '../services/api';
import WebSocketService from '../services/WebSocketService';

const AdminDashboard = ({ onLogout }) => {
  const [stations, setStations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddStation, setShowAddStation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [wsService, setWsService] = useState(null);

  useEffect(() => {
    // Initialize WebSocket
    const websocket = new WebSocketService();
    websocket.connect();
    websocket.onConnectionChange = (status) => setConnectionStatus(status);
    websocket.onMessage = handleWebSocketMessage;
    setWsService(websocket);

    // Fetch initial data
    fetchStations();

    return () => {
      if (websocket) {
        websocket.disconnect();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'station_update':
        setStations(prev => prev.map(station => 
          station.id === data.data.stationId ? { ...station, ...data.data.stationData } : station
        ));
        break;
      case 'session_update':
        updateStationSession(data.data);
        break;
      case 'new_station':
        setStations(prev => [...prev, data.data.station]);
        break;
      case 'station_removed':
        setStations(prev => prev.filter(station => station.id !== data.data.stationId));
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const updateStationSession = (data) => {
    setStations(prev => prev.map(station => 
      station.id === data.stationId 
        ? { ...station, currentSession: data.session, status: data.session ? 'OCCUPIED' : 'AVAILABLE' }
        : station
    ));
  };

  const fetchStations = async () => {
    try {
      const data = await getStations();
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const handleAddStation = async (stationData) => {
    try {
      await createStation(stationData);
      setShowAddStation(false);
      // Station will be added via WebSocket
    } catch (error) {
      console.error('Error adding station:', error);
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (!window.confirm('Are you sure you want to delete this station?')) return;
    
    try {
      await deleteStation(stationId);
    } catch (error) {
      console.error('Error deleting station:', error);
    }
  };

  const handleLockStation = async (stationId) => {
    try {
      await lockStation(stationId);
    } catch (error) {
      console.error('Error locking station:', error);
    }
  };

  const handleUnlockStation = async (stationId) => {
    try {
      await unlockStation(stationId);
    } catch (error) {
      console.error('Error unlocking station:', error);
    }
  };

  const handleStartSession = async (stationId, sessionData) => {
    try {
      await startSession(stationId, sessionData);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await endSession(sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleAddTime = async (sessionId, minutes) => {
    try {
      await addTime(sessionId, minutes);
    } catch (error) {
      console.error('Error adding time:', error);
    }
  };

  // Calculate dashboard statistics
  const stats = {
    totalStations: stations.length,
    availableStations: stations.filter(s => s.status === 'AVAILABLE').length,
    occupiedStations: stations.filter(s => s.status === 'OCCUPIED').length,
    maintenanceStations: stations.filter(s => s.status === 'MAINTENANCE').length,
    totalRevenue: stations
      .filter(s => s.currentSession)
      .reduce((sum, station) => sum + (station.hourlyRate * 0.5), 0)
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Gaming Cafe Admin</h1>
              <div className={`px-2 py-1 rounded-full text-xs ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus === 'connected' ? '● Connected' : 
                 connectionStatus === 'disconnected' ? '● Disconnected' : '● Error'}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('stations')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'stations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Monitor className="w-5 h-5 inline mr-2" />
                Stations
              </button>
              <button 
                onClick={onLogout}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 inline mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Stations"
                value={stats.totalStations}
                icon={<Monitor className="w-8 h-8" />}
                color="bg-blue-500"
              />
              <StatCard 
                title="Available"
                value={stats.availableStations}
                icon={<CheckCircle className="w-8 h-8" />}
                color="bg-green-500"
              />
              <StatCard 
                title="Occupied"
                value={stats.occupiedStations}
                icon={<Users className="w-8 h-8" />}
                color="bg-red-500"
              />
              <StatCard 
                title="Revenue Today"
                value={`${stats.totalRevenue.toFixed(2)}`}
                icon={<DollarSign className="w-8 h-8" />}
                color="bg-purple-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setShowAddStation(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">Add New Station</p>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">View Analytics</p>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">System Settings</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === 'stations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Station Management</h2>
              <button 
                onClick={() => setShowAddStation(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Station
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map(station => (
                <StationCard 
                  key={station.id} 
                  station={station} 
                  onLock={() => handleLockStation(station.id)}
                  onUnlock={() => handleUnlockStation(station.id)}
                  onDelete={() => handleDeleteStation(station.id)}
                  onStartSession={(data) => handleStartSession(station.id, data)}
                  onEndSession={() => handleEndSession(station.currentSession?.id)}
                  onAddTime={(minutes) => handleAddTime(station.currentSession?.id, minutes)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddStation && (
        <AddStationModal 
          onClose={() => setShowAddStation(false)}
          onAdd={handleAddStation}
        />
      )}
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

// Station Card Component
const StationCard = ({ station, onLock, onUnlock, onDelete, onStartSession, onEndSession, onAddTime }) => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionData, setSessionData] = useState({ customerName: '', timeMinutes: 60, prepaidAmount: 0 });

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500';
      case 'OCCUPIED': return 'bg-red-500';
      case 'MAINTENANCE': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStartSession = () => {
    if (sessionData.customerName.trim()) {
      onStartSession(sessionData);
      setShowSessionForm(false);
      setSessionData({ customerName: '', timeMinutes: 60, prepaidAmount: 0 });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            {station.type === 'PC' ? <Monitor className="w-6 h-6 text-blue-600" /> : <Gamepad2 className="w-6 h-6 text-purple-600" />}
            <div>
              <h3 className="font-semibold text-lg">{station.name}</h3>
              <p className="text-sm text-gray-500">{station.type}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(station.status)}`}>
            {station.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p><span className="font-medium">Rate:</span> ${station.hourlyRate}/hour</p>
          {station.ipAddress && <p><span className="font-medium">IP:</span> {station.ipAddress}</p>}
          <p><span className="font-medium">Specs:</span> {station.specifications}</p>
          {station.isLocked && <p className="text-red-600 font-medium">🔒 Station Locked</p>}
        </div>

        {station.currentSession && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">Active Session</p>
            <p className="text-sm text-red-700">Customer: {station.currentSession.customerName}</p>
            <p className="text-sm text-red-700">Time Left: {formatTime(station.currentSession.timeRemaining)}</p>
            <p className="text-sm text-red-700">Started: {new Date(station.currentSession.startTime).toLocaleTimeString()}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {station.status === 'AVAILABLE' && !showSessionForm && (
            <button 
              onClick={() => setShowSessionForm(true)}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4 inline mr-1" />
              Start Session
            </button>
          )}
          
          {station.status === 'OCCUPIED' && (
            <>
              <button 
                onClick={onEndSession}
                className="bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4 inline mr-1" />
                End Session
              </button>
              <button 
                onClick={() => onAddTime(30)}
                className="bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                +30min
              </button>
            </>
          )}

          <button 
            onClick={station.isLocked ? onUnlock : onLock}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              station.isLocked 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {station.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>

          <button 
            onClick={onDelete}
            className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Session Start Form */}
        {showSessionForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Start New Session</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={sessionData.customerName}
                onChange={(e) => setSessionData({...sessionData, customerName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Time (minutes)"
                  value={sessionData.timeMinutes}
                  onChange={(e) => setSessionData({...sessionData, timeMinutes: parseInt(e.target.value)})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Prepaid ($)"
                  value={sessionData.prepaidAmount}
                  onChange={(e) => setSessionData({...sessionData, prepaidAmount: parseFloat(e.target.value)})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleStartSession}
                  className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700"
                >
                  Start
                </button>
                <button 
                  onClick={() => setShowSessionForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Station Modal Component
const AddStationModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'PC',
    hourlyRate: 3.0,
    ipAddress: '',
    specifications: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onAdd(formData);
      setFormData({ name: '', type: 'PC', hourlyRate: 3.0, ipAddress: '', specifications: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Station</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Gaming-PC-01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PC">Gaming PC</option>
              <option value="PS5">PlayStation 5</option>
              <option value="PS4">PlayStation 4</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
            <input
              type="number"
              step="0.5"
              required
              value={formData.hourlyRate}
              onChange={(e) => setFormData({...formData, hourlyRate: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {formData.type === 'PC' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="192.168.1.xxx"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
            <textarea
              value={formData.specifications}
              onChange={(e) => setFormData({...formData, specifications: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              placeholder="e.g., RTX 4060, i5-12400F, 16GB RAM"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add Station
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;