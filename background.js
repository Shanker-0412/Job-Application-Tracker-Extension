// Set up alarm for periodic checking
chrome.alarms.create("checkApplicationStatus", { periodInMinutes: 60 });

chrome.runtime.onInstalled.addListener(() => {
  console.log("Quick Job Application Tracker installed");
  // Initialize storage with empty applications array if it doesn't exist
  chrome.storage.sync.get({ applications: [] }, (result) => {
    if (!result.applications.length) {
      chrome.storage.sync.set({ applications: [] });
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkApplicationStatus") {
    checkAllApplicationStatuses();
  }
});

async function checkAllApplicationStatuses() {
  const { applications } = await chrome.storage.sync.get({ applications: [] });
  let updated = false;

  for (let i = 0; i < applications.length; i++) {
    const newStatus = await checkApplicationStatus(applications[i]);
    if (newStatus && newStatus !== applications[i].status) {
      applications[i].status = newStatus;
      applications[i].lastChecked = new Date().toISOString();
      updated = true;
      
      // Send notification about status change
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon128.png',  // Updated path
        title: 'Application Status Update',
        message: `Status for ${applications[i].company} changed to: ${newStatus}`
      });
    } else {
      applications[i].lastChecked = new Date().toISOString();
    }
  }

  if (updated) {
    await chrome.storage.sync.set({ applications });
  }
}

async function checkApplicationStatus(application) {
  // This is a placeholder function. In a real-world scenario, 
  // you would implement actual status checking logic here.
  // This could involve web scraping or API calls to job portals.

  // For demonstration, we'll just randomly change the status sometimes
  const statuses = ['Applied', 'Under Review', 'Interview Scheduled', 'Offer Extended', 'Rejected'];
  if (Math.random() < 0.3) {  // 30% chance of status change
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  return null;  // No change
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkNow") {
    checkAllApplicationStatuses().then(() => {
      sendResponse({message: "Status check completed"});
    });
    return true;  // Indicates we will respond asynchronously
  }
});