/**
 * Test script for monitoring system
 * Run from the browser console or use as reference
 */

// 1. Trigger a health check manually
async function triggerHealthCheck(userId: string) {
  try {
    const response = await fetch('/api/health-check', {
      method: 'POST',
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Health Check Results:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// 2. Fetch monitoring data
async function fetchMonitoringData(userId: string, siteId?: string) {
  try {
    const params = siteId ? `?siteId=${siteId}` : '';
    const response = await fetch(`/api/monitoring${params}`, {
      headers: { 'x-user-id': userId },
    });

    const data = await response.json();
    console.log('Monitoring Data:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// 3. Fetch alerts
async function fetchAlerts(userId: string, siteId?: string) {
  try {
    const params = siteId ? `?siteId=${siteId}` : '';
    const response = await fetch(`/api/alerts${params}`, {
      headers: { 'x-user-id': userId },
    });

    const data = await response.json();
    console.log('Alerts:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// 4. Resolve an alert
async function resolveAlert(userId: string, siteId: string, alertId: string) {
  try {
    const response = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId, alertId }),
    });

    const data = await response.json();
    console.log('Alert resolved:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// 5. Get health check history for a site
async function getHealthCheckHistory(userId: string, siteId: string) {
  try {
    const response = await fetch(`/api/health-check?siteId=${siteId}`, {
      headers: { 'x-user-id': userId },
    });

    const data = await response.json();
    console.log('Health Check History:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage:
// 1. Get your userId from localStorage or the auth context
// const userId = 'your-user-id';
//
// 2. Trigger a health check
// triggerHealthCheck(userId);
//
// 3. After a few seconds, fetch the monitoring data
// fetchMonitoringData(userId);
//
// 4. Check for any alerts
// fetchAlerts(userId);
//
// 5. Resolve an alert if needed
// resolveAlert(userId, 'siteId', 'alertId');
